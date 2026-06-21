import React, { useState, useEffect, useRef, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, Lightbulb, X } from 'lucide-react';
import { SessionState, SessionAction } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { CUSTOMER_POOL_ID } from '../i18n/id';
import { CUSTOMER_POOL_EN } from '../i18n/en';
import MathPet from './MathPet';
import NumPad from './NumPad';
import { playCorrectSound, playWrongSound } from '../utils/soundEngine';
import { triggerHaptic } from '../utils/hapticEngine';
import { ImpactStyle } from '@capacitor/haptics';

// --- 3D Claymorphism grocery items assets ---
import riceImg from '../assets/items/rice.png';
import eggsImg from '../assets/items/eggs.png';
import oilImg from '../assets/items/oil.png';
import sugarImg from '../assets/items/sugar.png';
import waterGalImg from '../assets/items/water_gal.png';
import noodlesImg from '../assets/items/noodles.png';
import crackerImg from '../assets/items/cracker.png';
import biscuitImg from '../assets/items/biscuit.png';
import chipsImg from '../assets/items/chips.png';
import tempehImg from '../assets/items/tempeh.png';
import bananaImg from '../assets/items/banana.png';
import teaImg from '../assets/items/tea.png';
import coffeeImg from '../assets/items/coffee.png';
import milkImg from '../assets/items/milk.png';
import sodaImg from '../assets/items/soda.png';
import soapImg from '../assets/items/soap.png';

interface WarungBoardProps {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  feedPet: (expGained: number) => Promise<{ leveledUp: boolean; nextLevel: number }>;
  addCoins: (amount: number) => Promise<void>;
  buyUpgrade: (id: string, cost: number) => Promise<void>;
  equipUpgrade: (id: string) => Promise<void>;
}

interface UpgradeItem {
  id: string;
  nameKey: string;
  cost: number;
  type: 'table' | 'mascot';
  emoji: string;
}

const UPGRADE_ITEMS: UpgradeItem[] = [
  { id: 'default', nameKey: 'warung.upgradeTableDefault', cost: 0, type: 'table', emoji: '⬜' },
  { id: 'table_wood', nameKey: 'warung.upgradeTablePremium', cost: 40, type: 'table', emoji: '🪵' },
  { id: 'table_neon', nameKey: 'warung.upgradeTableNeon', cost: 80, type: 'table', emoji: '⚡' },
  { id: 'mascot_cat', nameKey: 'warung.upgradeMascotCat', cost: 60, type: 'mascot', emoji: '🐱' },
];

interface WarungItem {
  id: string;
  nameKey: string;
  price: number;
  quantity: number;
  icon: string;
}

const ITEM_POOL = [
  // === Makanan Pokok ===
  { key: 'rice', basePrice: 15000, icon: riceImg },
  { key: 'rice_medium', basePrice: 13000, icon: riceImg },
  { key: 'flour', basePrice: 11000, icon: '🥡' },
  { key: 'flour_sticky', basePrice: 14000, icon: '🥡' },
  { key: 'tapioca', basePrice: 12000, icon: '🥡' },
  { key: 'oat', basePrice: 18000, icon: '🥣' },

  // === Mie & Snack ===
  { key: 'noodles', basePrice: 3500, icon: noodlesImg },
  { key: 'noodles_cup', basePrice: 5500, icon: noodlesImg },
  { key: 'bihun', basePrice: 4000, icon: '🍜' },
  { key: 'cracker', basePrice: 1000, icon: crackerImg },
  { key: 'cracker_prawn', basePrice: 15000, icon: crackerImg },
  { key: 'biscuit', basePrice: 7500, icon: biscuitImg },
  { key: 'biscuit_cream', basePrice: 8500, icon: biscuitImg },
  { key: 'wafer', basePrice: 3000, icon: '🍫' },
  { key: 'chips', basePrice: 6000, icon: chipsImg },
  { key: 'permen', basePrice: 2000, icon: '🍬' },
  { key: 'coklat', basePrice: 10000, icon: '🍫' },

  // === Minuman ===
  { key: 'water', basePrice: 4000, icon: '💧' },
  { key: 'water_gal', basePrice: 6000, icon: waterGalImg },
  { key: 'tea', basePrice: 3000, icon: teaImg },
  { key: 'teapack', basePrice: 6000, icon: '📦' },
  { key: 'coffee', basePrice: 4000, icon: coffeeImg },
  { key: 'coffee_sachet', basePrice: 2000, icon: coffeeImg },
  { key: 'milk', basePrice: 6000, icon: milkImg },
  { key: 'milk_sweetened', basePrice: 12000, icon: milkImg },
  { key: 'syrup', basePrice: 22000, icon: '🍾' },
  { key: 'soda', basePrice: 5000, icon: sodaImg },
  { key: 'energy_drink', basePrice: 7000, icon: '⚡' },
  { key: 'juice_pack', basePrice: 8000, icon: '🧃' },

  // === Bumbu & Dapur ===
  { key: 'sugar', basePrice: 17500, icon: sugarImg },
  { key: 'sugar_palm', basePrice: 18000, icon: sugarImg },
  { key: 'salt', basePrice: 3000, icon: '🧂' },
  { key: 'oil', basePrice: 17000, icon: oilImg },
  { key: 'oil_coconut', basePrice: 28000, icon: oilImg },
  { key: 'soy_sauce', basePrice: 10500, icon: '🍶' },
  { key: 'soy_sauce_salty', basePrice: 9000, icon: '🍶' },
  { key: 'chili_sauce', basePrice: 8500, icon: '🌶️' },
  { key: 'tomato_sauce', basePrice: 7500, icon: '🍅' },
  { key: 'vinegar', basePrice: 3500, icon: '🧪' },
  { key: 'msg', basePrice: 2500, icon: '🧂' },
  { key: 'santan', basePrice: 3000, icon: '🥥' },
  { key: 'terasi', basePrice: 1500, icon: '🍢' },
  { key: 'bumbu_racik', basePrice: 2500, icon: '🧂' },

  // === Telur & Protein ===
  { key: 'eggs', basePrice: 2500, icon: eggsImg },
  { key: 'eggs_quail', basePrice: 12000, icon: '🥚' },
  { key: 'sardine', basePrice: 11500, icon: '🥫' },
  { key: 'corned', basePrice: 24000, icon: '🥫' },
  { key: 'tofu', basePrice: 4000, icon: '⬜' },
  { key: 'tempeh', basePrice: 6000, icon: tempehImg },

  // === Makanan Siap Saji ===
  { key: 'banana', basePrice: 1500, icon: bananaImg },
  { key: 'gorengan', basePrice: 1500, icon: '🍘' },
  { key: 'bakso', basePrice: 1000, icon: '🍢' },
  { key: 'risol', basePrice: 2500, icon: '🥟' },

  // === Kebersihan & Perawatan ===
  { key: 'soap', basePrice: 2500, icon: soapImg },
  { key: 'soap_dish', basePrice: 2000, icon: soapImg },
  { key: 'soap_body', basePrice: 3500, icon: soapImg },
  { key: 'shampoo', basePrice: 1000, icon: '🧼' },
  { key: 'toothpaste', basePrice: 6000, icon: '🪥' },
  { key: 'detergent', basePrice: 2000, icon: '🧺' },
  { key: 'softener', basePrice: 1500, icon: '🧺' },
  { key: 'tissue', basePrice: 7000, icon: '🧻' },
  { key: 'tissue_wet', basePrice: 9500, icon: '🧻' },
  { key: 'plastic_bag', basePrice: 5000, icon: '🛍️' },
  { key: 'garbage_bag', basePrice: 12000, icon: '🗑️' },

  // === Rokok & Pulsa ===
  { key: 'cigarette', basePrice: 2500, icon: '🚬' },
  { key: 'cigarette_pack', basePrice: 32000, icon: '🚬' },
  { key: 'lighter', basePrice: 4000, icon: '🔥' },
  { key: 'matches', basePrice: 1000, icon: '🪵' },
  { key: 'pulsa', basePrice: 12000, icon: '📱' },
  { key: 'data_package', basePrice: 37000, icon: '📶' },

  // === Alat Tulis & Lainnya ===
  { key: 'pencil', basePrice: 2500, icon: '✏️' },
  { key: 'pen', basePrice: 3000, icon: '🖊️' },
  { key: 'notebook', basePrice: 5000, icon: '📓' },
  { key: 'rubber_band', basePrice: 1000, icon: '⭕' },
  { key: 'staple', basePrice: 6000, icon: '📎' },
  { key: 'candle', basePrice: 2000, icon: '🕯️' },
  { key: 'battery', basePrice: 5000, icon: '🔋' },
  { key: 'cellotape', basePrice: 3000, icon: '🎞️' },
];

function generateRupiahPayment(total: number): number[] {
  const banknotes = [100000, 50000, 20000, 10000, 5000, 2000, 1000];
  const rand = Math.random();
  
  // Scenario 1: Single large banknote (e.g. paying 15.000 with a 20.000 note)
  if (rand < 0.4) {
    for (let i = banknotes.length - 1; i >= 0; i--) {
      if (banknotes[i] > total) {
        return [banknotes[i]];
      }
    }
  }
  
  // Scenario 2: Multiple of the same banknote (e.g. paying 12.000 with three 5.000 notes)
  if (rand < 0.7) {
    for (const note of [20000, 10000, 5000, 2000, 1000]) {
      if (note < total && total < note * 5) {
        const count = Math.ceil((total + 100) / note); // Ensure strictly greater
        return Array(count).fill(note);
      }
    }
  }
  
  // Scenario 3: Mixed banknotes (e.g. paying 57.000 with 50.000 + 10.000)
  let remaining = total;
  const result: number[] = [];
  
  for (const note of banknotes) {
    if (remaining >= note) {
      const count = Math.floor(remaining / note);
      for (let i = 0; i < count; i++) {
        result.push(note);
      }
      remaining -= note * count;
    }
  }
  
  // Add one more banknote to cover the remaining amount and exceed it
  if (remaining >= 0) {
    let added = false;
    for (let i = banknotes.length - 1; i >= 0; i--) {
      if (banknotes[i] > remaining) {
        result.push(banknotes[i]);
        added = true;
        break;
      }
    }
    if (!added) {
      result.push(1000); // Fallback to smallest note
    }
  }
  
  result.sort((a, b) => b - a);
  return result;
}

const BANKNOTE_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  100000: { bg: 'bg-[#fee2e2] dark:bg-[#991b1b]/20', text: 'text-[#dc2626] dark:text-[#fca5a5]', border: 'border-[#fecaca] dark:border-[#991b1b]/35' },
  50000: { bg: 'bg-[#dbeafe] dark:bg-[#1e40af]/20', text: 'text-[#2563eb] dark:text-[#93c5fd]', border: 'border-[#bfdbfe] dark:border-[#1e40af]/35' },
  20000: { bg: 'bg-[#dcfce7] dark:bg-[#166534]/20', text: 'text-[#16a34a] dark:text-[#86efac]', border: 'border-[#bbf7d0] dark:border-[#166534]/35' },
  10000: { bg: 'bg-[#f3e8ff] dark:bg-[#5b21b6]/20', text: 'text-[#7c3aed] dark:text-[#c084fc]', border: 'border-[#e9d5ff] dark:border-[#5b21b6]/35' },
  5000:  { bg: 'bg-[#fef9c3] dark:bg-[#854d0e]/20', text: 'text-[#ca8a04] dark:text-[#fde047]', border: 'border-[#fef08a] dark:border-[#854d0e]/35' },
  2000:  { bg: 'bg-[#f3f4f6] dark:bg-[#374151]/20', text: 'text-[#4b5563] dark:text-[#d1d5db]', border: 'border-[#e5e7eb] dark:border-[#374151]/35' },
  1000:  { bg: 'bg-[#ffedd5] dark:bg-[#7c2d12]/20', text: 'text-[#c2410c] dark:text-[#fb923c]', border: 'border-[#fed7aa] dark:border-[#7c2d12]/35' },
};

/**
 * Generates a random customer order containing items from the pool based on difficulty level.
 * Calculates total price and determines the banknote payment amount.
 */
function generateCustomerOrder(difficulty: string): { items: WarungItem[]; total: number; payment: number; paymentNotes: number[]; couponAmount: number } {
  let itemCount = 2;
  if (difficulty === 'medium') itemCount = 3;
  else if (difficulty === 'hard') itemCount = 4;

  const selectedItems: WarungItem[] = [];
  const pool = [...ITEM_POOL];

  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  let totalBeforeDiscount = 0;
  for (let i = 0; i < itemCount; i++) {
    const pItem = pool[i];
    const quantity = Math.floor(Math.random() * 3) + 1; // Quantity: 1 to 3
    const price = pItem.basePrice;
    totalBeforeDiscount += price * quantity;
    selectedItems.push({
      id: `${pItem.key}-${i}`,
      nameKey: `warung.items.${pItem.key}`,
      price,
      quantity,
      icon: pItem.icon,
    });
  }

  // Determine coupon discount (30% chance in medium, 40% in hard)
  let couponAmount = 0;
  const hasCoupon = (difficulty === 'medium' && Math.random() < 0.3) || (difficulty === 'hard' && Math.random() < 0.4);
  if (hasCoupon && totalBeforeDiscount > 15000) {
    couponAmount = Math.random() < 0.5 ? 5000 : 10000;
  }

  const total = Math.max(2000, totalBeforeDiscount - couponAmount); // Ensure total is never 0
  const paymentNotes = generateRupiahPayment(total);
  const payment = paymentNotes.reduce((a, b) => a + b, 0);

  return { items: selectedItems, total, payment, paymentNotes, couponAmount };
}

interface CustomerProfile {
  name: string;
  avatar: string;
  dialogueTotal: string;
  dialogueChange: string;
}

// Dialogue pool pools are imported from i18n files

function generateRandomCustomer(language: string): CustomerProfile {
  const pool = language === 'en' ? CUSTOMER_POOL_EN : CUSTOMER_POOL_ID;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

/**
 * Gameplay container for the "Kasir Warung" (Warung Cashier) mode.
 * Contains item calculations, change calculations, pet companion rewards, and a daily summary receipt.
 */
export const WarungBoard: React.FC<WarungBoardProps> = ({ state, dispatch, feedPet, addCoins, buyUpgrade, equipUpgrade }) => {
  const { t } = useTranslation();
  const { settings, pet } = state;
  const difficulty = state.config?.difficulty || 'easy';

  const [customerIndex, setCustomerIndex] = useState(0); // 0 to 4
  const [stage, setStage] = useState<'total' | 'change' | 'completed'>('total');
  const [currentOrder, setCurrentOrder] = useState(() => generateCustomerOrder(difficulty));
  
  const [typedAnswer, setTypedAnswer] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isCorrectFeedback, setIsCorrectFeedback] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  const [petAnimationState, setPetAnimationState] = useState<'idle' | 'eating' | 'levelUp'>('idle');
  const [customerProfile, setCustomerProfile] = useState(() => generateRandomCustomer(settings.language));
  const [wrongSpeechOverride, setWrongSpeechOverride] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showShop, setShowShop] = useState(false);

  // Patience Meter States
  const [patience, setPatience] = useState(100);
  const [sessionTipsTotal, setSessionTipsTotal] = useState(0);

  // Patience countdown ticker
  useEffect(() => {
    if (stage === 'completed' || isSubmitting || feedbackMsg || showTips || showShop) return;

    // Connect to settings timer
    const timerSetting = settings.timerPerQuestion;
    if (timerSetting === 0) {
      // If timer is disabled in settings, customer patience does not decay at all!
      return;
    }

    const interval = setInterval(() => {
      setPatience((prev) => {
        // Calculate decay based on timer limit (e.g. 100 points / duration)
        // Hard difficulty decays 1.5x faster, Easy decays 0.7x slower
        const multiplier = difficulty === 'hard' ? 1.5 : difficulty === 'medium' ? 1.0 : 0.7;
        const baseDecay = 100 / timerSetting;
        const decay = Math.max(1, Math.round(baseDecay * multiplier));
        const nextVal = prev - decay;
        return nextVal < 0 ? 0 : nextVal;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, isSubmitting, feedbackMsg, showTips, showShop, difficulty, settings.timerPerQuestion]);

  // Dynamic Cashier Tips Generators
  const getZeroTipString = () => {
    if (stage === 'total') {
      const parts = currentOrder.items.map(item => `${(item.price * item.quantity) / 1000}`);
      const sumParts = parts.join(' + ');
      const sumVal = currentOrder.total / 1000;
      return t('warung.tipZeroTotal', {
        expr: sumParts,
        result: String(sumVal),
        total: currentOrder.total.toLocaleString('id-ID'),
      });
    } else {
      const payK = currentOrder.payment / 1000;
      const totalK = currentOrder.total / 1000;
      const diffK = payK - totalK;
      const changeVal = currentOrder.payment - currentOrder.total;
      return t('warung.tipZeroChange', {
        pay: String(payK),
        total: String(totalK),
        diff: String(diffK),
        change: changeVal.toLocaleString('id-ID'),
      });
    }
  };

  const getTotalTipString = () => {
    let runningTotal = 0;
    const steps: string[] = [];
    currentOrder.items.forEach((item, idx) => {
      const itemTotal = item.price * item.quantity;
      const prevTotal = runningTotal;
      runningTotal += itemTotal;
      const name = t(item.nameKey);
      steps.push(t('warung.tipTotalStep', {
        step: String(idx + 1),
        prev: prevTotal.toLocaleString('id-ID'),
        name,
        itemTotal: itemTotal.toLocaleString('id-ID'),
        running: runningTotal.toLocaleString('id-ID'),
      }));
    });
    return steps.join('\n');
  };

  const getChangeTipString = () => {
    if (stage === 'total') {
      return t('warung.tipChangeWait');
    }
    
    const total = currentOrder.total;
    const payment = currentOrder.payment;
    const change = payment - total;
    
    const nextTenThousand = Math.ceil((total + 1) / 10000) * 10000;
    
    if (nextTenThousand < payment && nextTenThousand > total) {
      const diff1 = nextTenThousand - total;
      const diff2 = payment - nextTenThousand;
      return t('warung.tipChangeCountingUp', {
        total: total.toLocaleString('id-ID'),
        next: nextTenThousand.toLocaleString('id-ID'),
        diff1: diff1.toLocaleString('id-ID'),
        pay: payment.toLocaleString('id-ID'),
        diff2: diff2.toLocaleString('id-ID'),
        change: change.toLocaleString('id-ID'),
      });
    } else {
      return t('warung.tipChangeDirect', {
        pay: payment.toLocaleString('id-ID'),
        total: total.toLocaleString('id-ID'),
        change: change.toLocaleString('id-ID'),
      });
    }
  };

  // History tracking for receipt summary
  const [historyList, setHistoryList] = useState<{
    id: number;
    total: number;
    payment: number;
    change: number;
  }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Focus container on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // Handles numeric key input from the NumPad
  const handleInput = useCallback((digit: string): void => {
    if (isSubmitting) return;
    setWrongSpeechOverride(''); // Reset warning bubble when user begins correcting their answer
    setTypedAnswer((prev) => {
      if (prev.length >= 7) return prev; // Limit to 7 digits
      if (prev === '0') return digit;
      return prev + digit;
    });
  }, [isSubmitting]);

  // Handles backspace key deleting the last digit
  const handleDelete = useCallback(() => {
    if (isSubmitting) return;
    setWrongSpeechOverride(''); // Reset warning bubble when user begins correcting their answer
    setTypedAnswer((prev) => {
      if (prev.length <= 1) return '';
      return prev.slice(0, -1);
    });
  }, [isSubmitting]);

  const handleToggleSign = useCallback(() => {}, []);

  // Submits the typed answer and validates it based on the active stage (Total or Change)
  const handleAnswerSubmit = (): void => {
    if (isSubmitting || !typedAnswer) return;

    const parsed = parseInt(typedAnswer, 10);
    if (isNaN(parsed)) return;

    setIsSubmitting(true);

    if (stage === 'total') {
      const isCorrect = parsed === currentOrder.total;
      if (isCorrect) {
        playCorrectSound(settings.soundEnabled);
        triggerHaptic(ImpactStyle.Medium, settings.hapticEnabled);
        
        // Calculate tip coins
        let earnedTip = 0;
        if (patience > 60) earnedTip = 3;
        else if (patience > 20) earnedTip = 1;
        if (earnedTip > 0) setSessionTipsTotal(prev => prev + earnedTip);
        
        const tipText = earnedTip > 0 
          ? `\n${t('warung.earnedTip', { coins: earnedTip })}` 
          : `\n${patience <= 20 ? t('warung.patienceMad') : t('warung.patienceNormal')}`;

        setFeedbackMsg(t('warung.correctTotal', { amount: `Rp${currentOrder.total.toLocaleString('id-ID')}` }) + tipText);
        setIsCorrectFeedback(true);
        setPetAnimationState('eating');

        setTimeout(() => {
          setStage('change');
          setTypedAnswer('');
          setFeedbackMsg('');
          setPetAnimationState('idle');
          setIsSubmitting(false);
          setPatience(100);
        }, 1500);
      } else {
        playWrongSound(settings.soundEnabled);
        triggerHaptic(ImpactStyle.Heavy, settings.hapticEnabled);
        setFeedbackMsg(`${t('feedback.wrong')} ❌`);
        setIsCorrectFeedback(false);
        setWrongSpeechOverride(t('warung.wrongTotalSpeech'));
        
        setTimeout(() => {
          setFeedbackMsg('');
          setIsSubmitting(false);
        }, 1200);
      }
    } else if (stage === 'change') {
      const correctChange = currentOrder.payment - currentOrder.total;
      const isCorrect = parsed === correctChange;

      if (isCorrect) {
        playCorrectSound(settings.soundEnabled);
        triggerHaptic(ImpactStyle.Medium, settings.hapticEnabled);
        
        // Calculate tip coins
        let earnedTip = 0;
        if (patience > 60) earnedTip = 3;
        else if (patience > 20) earnedTip = 1;
        if (earnedTip > 0) setSessionTipsTotal(prev => prev + earnedTip);
        
        const tipText = earnedTip > 0 
          ? `\n${t('warung.earnedTip', { coins: earnedTip })}` 
          : `\n${patience <= 20 ? t('warung.patienceMad') : t('warung.patienceNormal')}`;

        setFeedbackMsg(t('warung.correctChange', { amount: `Rp${correctChange.toLocaleString('id-ID')}` }) + tipText);
        setIsCorrectFeedback(true);
        setPetAnimationState('eating');
        setSuccessCount(prev => prev + 1);

        // Save history item
        setHistoryList(prev => [
          ...prev,
          {
            id: customerIndex + 1,
            total: currentOrder.total,
            payment: currentOrder.payment,
            change: correctChange,
          }
        ]);

        setTimeout(() => {
          if (customerIndex < 4) {
            const nextIndex = customerIndex + 1;
            setCustomerIndex(nextIndex);
            setCurrentOrder(generateCustomerOrder(difficulty));
            setCustomerProfile(generateRandomCustomer(settings.language));
            setStage('total');
            setTypedAnswer('');
            setFeedbackMsg('');
            setPetAnimationState('idle');
            setIsSubmitting(false);
            setPatience(100);
          } else {
            setStage('completed');
            setPetAnimationState('idle');
            setIsSubmitting(false);
          }
        }, 1500);
      } else {
        playWrongSound(settings.soundEnabled);
        triggerHaptic(ImpactStyle.Heavy, settings.hapticEnabled);
        setFeedbackMsg(`${t('feedback.wrong')} ❌`);
        setIsCorrectFeedback(false);
        setWrongSpeechOverride(t('warung.wrongChangeSpeech'));
        
        setTimeout(() => {
          setFeedbackMsg('');
          setIsSubmitting(false);
        }, 1200);
      }
    }
  };

  // Feeds the pet with earned EXP and returns to the Main Menu
  const handleClaimReward = async (): Promise<void> => {
    const expGained = successCount * 10;
    if (expGained > 0 && pet.hasAdopted) {
      await feedPet(expGained);
      dispatch({ type: 'FEED_PET', payload: { expGained } });
    }
    if (sessionTipsTotal > 0) {
      await addCoins(sessionTipsTotal);
    }
    dispatch({ type: 'BACK_TO_MENU' });
  };

  // Formats currency string with standard Indonesian format (e.g. Rp10.000)
  const formatDisplayValue = (raw: string): string => {
    if (!raw) return 'Rp...';
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) return 'Rp...';
    return `Rp${parsed.toLocaleString('id-ID')}`;
  };

  if (stage === 'completed') {
    const expAwarded = successCount * 10;
    return (
      <div className="flex-1 flex flex-col bg-[#fafafc] dark:bg-[#121218] overflow-y-auto font-gacha" style={{ fontSize: 'calc(1rem * var(--font-scale, 1))' }}>
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between border-b border-neutral-200 dark:border-[#d4af37]/20 p-4 bg-white dark:bg-[#1a1a24]">
          <div className="w-6" />
          <h1 className="text-[17px] font-bold text-[#1d1d1f] dark:text-white tracking-wide font-fantasy">
            {t('warung.shopClosed')}
          </h1>
          <div className="w-6" />
        </header>

        {/* Content */}
        <main className="p-5 flex-1 flex flex-col justify-between items-center space-y-6 max-w-[400px] mx-auto w-full">
          {/* Invoice Styled Receipt */}
          <div className="w-full bg-white dark:bg-[#1a1a24] border border-neutral-200 dark:border-[#d4af37]/35 rounded-[18px] p-5 flex flex-col relative shadow-[0_4px_20px_rgba(212,175,55,0.08)]">
            <h2 className="text-center text-[13px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest border-b border-dashed border-neutral-200 dark:border-[#d4af37]/25 pb-3 mb-4 font-fantasy">
              ✨ {t('warung.receiptTitle')} ✨
            </h2>

            {/* List transactions */}
            <div className="space-y-3.5 mb-5 text-[14px]">
              {historyList.map((item) => (
                <div key={item.id} className="flex justify-between border-b border-[#f5f5f7] dark:border-[#1d1d1f] pb-2 text-ink-muted">
                  <span className="font-semibold text-[#1d1d1f] dark:text-white">{t('warung.receiptCustomer', { id: item.id })}</span>
                  <span className="tabular-nums font-fantasy">
                    {t('warung.labelTotal')}: Rp{item.total.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-neutral-200 dark:border-[#d4af37]/25 pt-4 flex flex-col space-y-2 text-center">
              <span className="text-[15px] font-medium text-[#1d1d1f] dark:text-white">
                {t('warung.servedSummary', { count: successCount, total: 5 })}
              </span>
              {sessionTipsTotal > 0 && (
                <span className="text-[14px] font-semibold text-amber-600 dark:text-amber-400">
                  {t('warung.totalTipsReceipt')}: +🪙 {sessionTipsTotal}
                </span>
              )}
              {expAwarded > 0 && pet.hasAdopted && (
                <span className="text-[15px] font-semibold text-amber-600 dark:text-amber-400">
                  {t('warung.earnExp', { exp: expAwarded, name: pet.name })}
                </span>
              )}
            </div>
          </div>

          {/* Action CTA */}
          <m.button
            type="button"
            onClick={handleClaimReward}
            whileTap={{ scale: 0.95 }}
            className="btn-primary"
          >
            {t('warung.btnClaim')}
          </m.button>
        </main>
      </div>
    );
  }



  const activeTable = pet.activeUpgrade || 'default';
  const getTableBgClass = () => {
    if (activeTable === 'table_wood') return 'bg-[#faf6f0] dark:bg-[#1f1614] text-[#4e342e]';
    if (activeTable === 'table_neon') return 'bg-[#0b0c16] dark:bg-black text-[#e9d5ff]';
    return 'bg-[#faf8f5] dark:bg-[#121218] text-neutral-800 dark:text-[#d4af37]/90';
  };

  const getHeaderClass = () => {
    if (activeTable === 'table_wood') return 'bg-[#f4efe8] dark:bg-[#2a1e1b] border-[#e4dccf] dark:border-[#382824] text-[#4e342e]';
    if (activeTable === 'table_neon') return 'bg-[#0f1020] dark:bg-neutral-950 border-[#2b1f48] dark:border-neutral-900 text-[#c084fc]';
    return 'bg-white dark:bg-[#1a1a24] border-neutral-200 dark:border-[#d4af37]/20 text-[#1d1d1f] dark:text-white';
  };

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      className={`flex-1 flex flex-col justify-between relative overflow-hidden focus:outline-none transition-colors duration-300 font-gacha ${getTableBgClass()}`}
      style={{ fontSize: 'calc(1rem * var(--font-scale, 1))' }}
    >
      {/* 1. Header sub-nav */}
      <header className={`flex-shrink-0 flex items-center justify-between gap-4 border-b p-3 z-10 transition-colors duration-300 ${getHeaderClass()}`}>
        <m.button
          type="button"
          onClick={() => dispatch({ type: 'BACK_TO_MENU' })}
          whileTap={{ scale: 0.95 }}
          className="btn-icon"
          aria-label={t('settings.backButton')}
        >
          <ChevronLeft className="w-5 h-5" />
        </m.button>

        {/* Customer Progress Indicator */}
        <span className="text-[12px] font-bold uppercase tracking-widest select-none opacity-85 font-fantasy">
          {t('warung.clientTitle', { current: customerIndex + 1, total: 5 })}
        </span>

        {/* Coins & Level Header Group */}
        <div className="flex items-center gap-1.5 shrink-0 select-none">
          <m.button
            type="button"
            onClick={() => setShowShop(true)}
            whileTap={{ scale: 0.95 }}
            className="coins-badge text-xs px-2.5 py-1"
          >
            <span>🪙</span>
            <span className="tabular-nums font-fantasy">{pet.coins || 0}</span>
          </m.button>
          
          {pet.hasAdopted && (
            <div className="bg-[#f5f5f7] dark:bg-[#272729] border border-neutral-200 dark:border-neutral-700/30 rounded-full px-2.5 py-1 flex items-center shrink-0">
              <span className="text-xs font-semibold text-ink-muted">
                {pet.name}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* 2. Interactive Counter Table */}
      <main className="p-3 flex-1 flex flex-col justify-between overflow-y-auto space-y-2.5">
        
        {/* Customer & Pet Interaction Area */}
        <div className="grid grid-cols-2 gap-3 bg-white/95 dark:bg-[#1a1a24]/95 border border-neutral-200 dark:border-[#d4af37]/25 rounded-[14px] p-2.5 relative select-none shadow-sm">
          {/* Left: Customer Dialogue */}
          <div className="flex items-start gap-2 border-r border-neutral-200 dark:border-[#d4af37]/20 pr-2">
            <div className="text-3xl shrink-0 mt-0.5 select-none">
              {customerProfile.avatar}
            </div>
            <div className="flex flex-col min-w-0 w-full">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#1d1d1f] dark:text-white truncate">
                  {customerProfile.name}
                </span>
                <span className="text-[10px] select-none">
                  {patience > 60 ? '😊' : patience > 20 ? '😐' : '😠'}
                </span>
              </div>
              
              {/* Patience bar */}
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1 rounded-full overflow-hidden mt-0.5">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    patience > 60 ? 'bg-green-500' : patience > 20 ? 'bg-amber-500' : 'bg-red-500'
                  }`} 
                  style={{ width: `${patience}%` }}
                />
              </div>

              <div className="bg-[#fafafc] dark:bg-[#20202d] border border-neutral-200 dark:border-neutral-700/35 px-2 py-1 rounded-[8px] text-[9px] font-normal text-[#1d1d1f] dark:text-white/90 leading-snug mt-1 relative select-none">
                {stage === 'total' ? customerProfile.dialogueTotal : customerProfile.dialogueChange}
              </div>
            </div>
          </div>

          {/* Right: Companion Pet Helper */}
          {pet.hasAdopted && (
            <div className="flex items-start gap-2 pl-1">
              <div className="shrink-0">
                <MathPet type={pet.type} level={pet.level} animationState={petAnimationState} className="w-8 h-8" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-[#d4af37] truncate font-fantasy">
                    {pet.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTips(true)}
                    className="text-[9px] font-bold text-amber-500 hover:text-amber-600 flex items-center gap-0.5 hover:underline shrink-0"
                  >
                    <Lightbulb className="w-2.5 h-2.5 animate-pulse" />
                    <span>{t('warung.tipsLabel')}</span>
                  </button>
                </div>
                <div className="bg-[#fafafc] dark:bg-[#20202d] border border-neutral-200 dark:border-neutral-700/35 px-2 py-1 rounded-[8px] text-[9px] font-normal text-[#1d1d1f] dark:text-white/90 leading-snug mt-1 relative select-none">
                  {wrongSpeechOverride || (stage === 'total' 
                    ? t('warung.petHelperTotal', { name: customerProfile.name }) 
                    : t('warung.petHelperChange', { name: customerProfile.name, pay: currentOrder.payment.toLocaleString('id-ID') }))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stage Area */}
        <div className="flex-1 flex flex-col justify-center my-0.5 relative">
          {stage === 'total' ? (
            /* Items List */
            <div className="flex flex-col space-y-2 max-w-[340px] mx-auto w-full">
              <div className="flex flex-col gap-2 w-full">
                {currentOrder.items.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-white dark:bg-[#1a1a24] border border-neutral-200 dark:border-[#d4af37]/30 rounded-[14px] px-3 py-2.5 flex items-center gap-3 select-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all"
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/20 rounded-[10px] flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/30 p-1 select-none">
                      {!item.icon.includes('/') && !item.icon.includes('.') && !item.icon.startsWith('data:') ? (
                        <span className="text-xl" role="img" aria-label={t(item.nameKey)}>
                          {item.icon}
                        </span>
                      ) : (
                        <img src={item.icon} alt={t(item.nameKey)} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                      )}
                    </div>

                    {/* Name + Unit Price */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-bold text-[#1d1d1f] dark:text-white leading-tight truncate">
                        {t(item.nameKey)}
                      </h4>
                      <span className="text-[12px] font-semibold text-amber-700 dark:text-amber-400 tabular-nums font-fantasy">
                        Rp{item.price.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Right: Qty Badge only */}
                    <div className="flex items-center gap-1 bg-amber-500 dark:bg-amber-600 rounded-[8px] px-2.5 py-1 shrink-0">
                      <span className="text-[13px] font-extrabold text-white leading-none tracking-wide">×{item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Discount Event card */}
              {currentOrder.couponAmount > 0 && (
                <m.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="border-2 border-dashed border-red-500/50 dark:border-red-500/60 bg-red-500/5 dark:bg-red-950/20 rounded-[14px] p-2 flex items-center justify-between text-red-600 dark:text-red-400 select-none animate-pulse"
                >
                  <span className="text-[11px] font-bold tracking-tight font-fantasy">
                    {t('warung.couponLabel', { amount: currentOrder.couponAmount.toLocaleString('id-ID') })}
                  </span>
                  <span className="text-lg">🎟️</span>
                </m.div>
              )}
            </div>
          ) : (
            /* Change Stage: Bill and Total resting on a card */
            <div className="flex flex-col items-center justify-center py-1 select-none">
              <div 
                className="bg-white dark:bg-[#1a1a24] border border-neutral-200 dark:border-[#d4af37]/35 rounded-[14px] p-3 w-full max-w-[210px] text-center"
                style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}
              >
                <div className="border border-dashed border-amber-500/30 dark:border-[#d4af37]/30 rounded-[10px] py-3 px-3 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 font-fantasy">
                    {t('warung.customerPays')}
                  </span>
                  <span className="text-xl font-bold text-amber-600 dark:text-[#d4af37] tracking-wide tabular-nums font-fantasy">
                    Rp{currentOrder.payment.toLocaleString('id-ID')}
                  </span>
                  {currentOrder.paymentNotes && currentOrder.paymentNotes.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {currentOrder.paymentNotes.map((note, idx) => {
                        const colors = BANKNOTE_COLORS[note] || { bg: 'bg-[#f3f4f6] dark:bg-[#374151]/20', text: 'text-[#4b5563] dark:text-[#d1d5db]', border: 'border-[#e5e7eb] dark:border-[#374151]/35' };
                        const displayLabel = `${note / 1000}k`;
                        return (
                          <span
                            key={idx}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none select-none tracking-tight ${colors.bg} ${colors.text} ${colors.border}`}
                          >
                            {displayLabel}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-[#d4af37]/20 text-center">
                  <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block font-fantasy">
                    {t('warung.totalBill')}
                  </span>
                  <span className="text-[15px] font-bold text-[#1d1d1f] dark:text-white tabular-nums block mt-0.5 font-fantasy">
                    Rp{currentOrder.total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Mascot decoration placement */}
              {pet.activeUpgrade === 'mascot_cat' && (
                <div className="absolute right-2 bottom-0 text-center select-none animate-bounce shrink-0 hidden sm:block">
                  <span className="text-3xl">🐱</span>
                  <span className="text-[7px] font-bold block text-amber-500 uppercase tracking-widest leading-none mt-0.5">Lucky Cat</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interactive Banknote Clickers */}
        <div className="flex justify-center gap-1 px-2 py-1 overflow-x-auto select-none no-scrollbar shrink-0">
          {[100000, 50000, 20000, 10000, 5000, 2000, 1000].map((note) => {
            const colors = BANKNOTE_COLORS[note];
            const label = note >= 1000 ? `${note / 1000}k` : `${note}`;
            return (
              <m.button
                key={note}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  setWrongSpeechOverride('');
                  setTypedAnswer((prev) => {
                    const currentVal = parseInt(prev, 10) || 0;
                    const nextVal = currentVal + note;
                    if (nextVal > 999999) return prev;
                    return String(nextVal);
                  });
                  triggerHaptic(ImpactStyle.Light, settings.hapticEnabled);
                }}
                className={`flex-1 min-w-[40px] max-w-[52px] py-1.5 rounded-[10px] border flex flex-col items-center justify-center font-bold font-fantasy select-none leading-none transition-shadow ${colors.bg} ${colors.text} ${colors.border}`}
                style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
              >
                <span className="text-[10px] tracking-tight">{label}</span>
                <span className="text-[6px] uppercase tracking-wider font-semibold opacity-85 mt-0.5">Rp</span>
              </m.button>
            );
          })}
        </div>

        {/* Input Answer Display */}
        <div className="rpg-panel border border-neutral-200 dark:border-[#d4af37]/20 p-2 text-center min-h-[48px] flex items-center justify-center bg-white dark:bg-[#1a1a24] shadow-inner relative select-none">
          <span className={`text-[20px] font-bold tracking-tight tabular-nums font-fantasy ${typedAnswer ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-400 dark:text-neutral-600'}`}>
            {formatDisplayValue(typedAnswer)}
          </span>
          <span className="absolute left-3 text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider font-fantasy">
            {stage === 'total' ? t('warung.labelTotal') : t('warung.labelChange')}
          </span>
        </div>

        {/* Keyboard Input Grid */}
        <div>
          <m.div>
            <NumPad
              onInput={handleInput}
              onDelete={handleDelete}
              onToggleSign={handleToggleSign}
              disableSign={true}
              isDecimalMode={false}
              hapticEnabled={settings.hapticEnabled}
            />
          </m.div>
        </div>

        {/* Submit Action */}
        <m.button
          type="button"
          onClick={handleAnswerSubmit}
          disabled={!typedAnswer || isSubmitting}
          whileTap={typedAnswer && !isSubmitting ? { scale: 0.95 } : undefined}
          className="btn-primary"
        >
          {t('game.submitButton')}
        </m.button>
      </main>

      {/* Success Feedback Overlay */}
      <AnimatePresence>
        {feedbackMsg && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm transition-colors duration-200 ${
              isCorrectFeedback ? 'bg-emerald-500/95' : 'bg-red-600/95'
            }`}
            role="alert"
          >
            <m.div
              initial={{ scale: 0.8, y: 10 }}
              animate={{ scale: 1, y: 0, transition: { type: 'spring', damping: 18 } }}
              className="text-white flex flex-col items-center"
            >
              {isCorrectFeedback ? (
                <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8" />
                </div>
              ) : null}
              <h2 className="text-2xl font-bold tracking-tight leading-snug font-fantasy">
                {feedbackMsg}
              </h2>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Tips Modal Sheet */}
      <AnimatePresence>
        {showTips && (
          <>
            {/* Backdrop */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTips(false)}
              className="absolute inset-0 bg-black z-40"
            />
            {/* Modal Sheet */}
            <m.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 inset-x-0 bg-white dark:bg-[#1a1a24] border-t border-neutral-200 dark:border-[#d4af37]/25 rounded-t-[20px] p-5 pb-6 z-50 flex flex-col space-y-4 max-h-[85%] overflow-y-auto select-none"
            >
              {/* Drag Handle Indicator */}
              <div className="w-10 h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-full mx-auto" />
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-500">
                  <Lightbulb className="w-5 h-5" />
                  <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white font-fantasy">
                    {t('warung.tipTitle')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTips(false)}
                  className="p-1.5 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tips content list */}
              <div className="space-y-4 pt-1">
                {/* Tip 1: Hide Three Zeros */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 shrink-0 rounded-full bg-amber-500/10 dark:bg-[#d4af37]/15 border border-[#d4af37]/35 flex items-center justify-center text-amber-600 dark:text-[#d4af37] text-xs font-bold font-fantasy">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1d1d1f] dark:text-white leading-tight font-fantasy">
                      {t('warung.tipZeroTitle')}
                    </h4>
                    <p className="text-xs text-ink-muted leading-relaxed mt-0.5 whitespace-pre-line">
                      {getZeroTipString()}
                    </p>
                  </div>
                </div>

                {/* Tip 2: Quick Total */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 shrink-0 rounded-full bg-amber-500/10 dark:bg-[#d4af37]/15 border border-[#d4af37]/35 flex items-center justify-center text-amber-600 dark:text-[#d4af37] text-xs font-bold font-fantasy">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1d1d1f] dark:text-white leading-tight font-fantasy">
                      {t('warung.tipTotalTitle')}
                    </h4>
                    <p className="text-xs text-ink-muted leading-relaxed mt-0.5 whitespace-pre-line">
                      {getTotalTipString()}
                    </p>
                  </div>
                </div>

                {/* Tip 3: Quick Change */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 shrink-0 rounded-full bg-amber-500/10 dark:bg-[#d4af37]/15 border border-[#d4af37]/35 flex items-center justify-center text-amber-600 dark:text-[#d4af37] text-xs font-bold font-fantasy">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1d1d1f] dark:text-white leading-tight font-fantasy">
                      {t('warung.tipChangeTitle')}
                    </h4>
                    <p className="text-xs text-ink-muted leading-relaxed mt-0.5 whitespace-pre-line">
                      {getChangeTipString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowTips(false)}
                className="btn-primary font-fantasy"
              >
                {t('warung.tipClose')}
              </button>
            </m.div>
          </>
        )}
      </AnimatePresence>

      {/* Shop Modal Sheet */}
      <AnimatePresence>
        {showShop && (
          <>
            {/* Backdrop */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShop(false)}
              className="absolute inset-0 bg-black z-40"
            />
            {/* Modal Sheet */}
            <m.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 inset-x-0 bg-white dark:bg-[#1a1a24] border-t border-neutral-200 dark:border-[#d4af37]/25 rounded-t-[20px] p-5 pb-6 z-50 flex flex-col space-y-4 max-h-[85%] overflow-y-auto select-none"
            >
              {/* Drag Handle Indicator */}
              <div className="w-10 h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-full mx-auto" />
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-500">
                  <span className="text-xl">🏪</span>
                  <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white font-fantasy">
                    {t('warung.shopTitle')}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-amber-600 dark:text-[#d4af37] font-fantasy">
                    🪙 {pet.coins || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowShop(false)}
                    className="p-1.5 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Upgrades List */}
              <div className="space-y-3 pt-1">
                {UPGRADE_ITEMS.map((item) => {
                  const isPurchased = (pet.purchasedUpgrades || ['default']).includes(item.id);
                  const isActive = (pet.activeUpgrade || 'default') === item.id;
                  const canBuy = (pet.coins || 0) >= item.cost;
                  
                  return (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-[14px] bg-white dark:bg-[#1a1a24] border border-neutral-200 dark:border-[#d4af37]/25 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl select-none">{item.emoji}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#1d1d1f] dark:text-white leading-tight font-fantasy">
                            {t(item.nameKey)}
                          </span>
                          <span className="text-[10px] text-ink-muted mt-0.5">
                            {item.cost > 0 ? t('warung.shopCoins', { count: item.cost }) : t('warung.shopFree')}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        {isActive ? (
                          <span className="text-xs font-bold text-green-600 dark:text-green-400 px-3 py-1 bg-green-50 dark:bg-green-950/20 rounded-full select-none">
                            {t('warung.shopEquipped')}
                          </span>
                        ) : isPurchased ? (
                          <button
                            type="button"
                            onClick={async () => {
                              await equipUpgrade(item.id);
                            }}
                            className="text-xs font-bold text-amber-500 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full hover:bg-amber-500/20 transition font-fantasy"
                          >
                            {t('warung.shopEquipBtn')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canBuy}
                            onClick={async () => {
                              await buyUpgrade(item.id, item.cost);
                            }}
                            className={`text-xs font-bold px-3 py-1.5 rounded-full transition font-fantasy ${
                              canBuy 
                                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm' 
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 border border-neutral-200 dark:border-neutral-700/50 cursor-not-allowed'
                            }`}
                          >
                            {t('warung.shopBuyBtn', { cost: item.cost })}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
export default WarungBoard;
