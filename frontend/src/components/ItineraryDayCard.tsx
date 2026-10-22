import React, { useState } from 'react';
import { Sun, CloudSun, Moon, MapPin, Clock, RotateCw, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { ItineraryDay, ItineraryActivity } from '../types';

interface Props {
  day: ItineraryDay;
  destination: string;
  travelStyle?: string;
  onRegenerateDay: (day: ItineraryDay) => Promise<void>;
  onReplaceActivity: (slot: 'morning' | 'afternoon' | 'evening', currentActivity: ItineraryActivity) => Promise<void>;
}

export const ItineraryDayCard: React.FC<Props> = ({
  day,
  onRegenerateDay,
  onReplaceActivity,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [swappingSlot, setSwappingSlot] = useState<string | null>(null);

  const handleRegenDay = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerateDay(day);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSwapSlot = async (slot: 'morning' | 'afternoon' | 'evening', act: ItineraryActivity) => {
    setSwappingSlot(slot);
    try {
      await onReplaceActivity(slot, act);
    } finally {
      setSwappingSlot(null);
    }
  };

  const renderSlot = (slot: 'morning' | 'afternoon' | 'evening', act?: ItineraryActivity) => {
    if (!act) return null;

    const iconMap = {
      morning: <Sun className="w-4 h-4 text-amber-500" />,
      afternoon: <CloudSun className="w-4 h-4 text-terracotta-500" />,
      evening: <Moon className="w-4 h-4 text-indigo-500" />,
    };

    const slotTitle = slot.charAt(0).toUpperCase() + slot.slice(1);
    const isSwapping = swappingSlot === slot;

    return (
      <div className="relative pl-6 pb-6 last:pb-0 border-l border-charcoal-200">
        {/* Timeline Node */}
        <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-white border border-charcoal-200 flex items-center justify-center shadow-soft-sm">
          {iconMap[slot]}
        </div>

        <div className="bg-ivory-50/70 hover:bg-white rounded-2xl p-4 border border-charcoal-100/70 transition-all hover:shadow-soft-sm">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400">
                {slotTitle}
              </span>
              <span className="text-xs text-charcoal-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-charcoal-400" />
                {act.time} ({act.duration_min}m)
              </span>
            </div>

            <button
              onClick={() => handleSwapSlot(slot, act)}
              disabled={isSwapping}
              className="text-[11px] font-medium text-forest-800 hover:text-forest-900 flex items-center gap-1 hover:underline disabled:opacity-50"
              title="Replace with an alternative activity"
            >
              <RefreshCw className={`w-3 h-3 ${isSwapping ? 'animate-spin' : ''}`} />
              <span>Swap</span>
            </button>
          </div>

          <h4 className="font-serif text-base font-semibold text-charcoal-900">
            {act.title}
          </h4>

          <p className="mt-1 text-xs text-charcoal-600 leading-relaxed">
            {act.description}
          </p>

          <div className="mt-3 flex items-center justify-between text-xs text-charcoal-500">
            <span className="flex items-center gap-1 text-charcoal-600">
              <MapPin className="w-3.5 h-3.5 text-sage-600" />
              <span className="truncate max-w-[220px]">{act.location}</span>
            </span>

            {act.estimated_cost > 0 && (
              <span className="font-semibold text-charcoal-800">
                ₹{act.estimated_cost.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-charcoal-200/80 shadow-soft-sm overflow-hidden mb-6 transition-all">
      {/* Header */}
      <div className="p-5 sm:p-6 bg-ivory-50/50 border-b border-charcoal-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-2xl bg-forest-800 text-ivory-100 flex items-center justify-center font-serif text-sm font-semibold shadow-soft-sm">
            {day.day_number}
          </span>
          <div>
            <h3 className="font-serif text-lg font-medium text-charcoal-900">
              {day.title}
            </h3>
            <p className="text-xs text-charcoal-500 line-clamp-1">{day.summary}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenDay}
            disabled={isRegenerating}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-forest-800 bg-sage-50 border border-sage-200/60 hover:bg-sage-100 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Regenerate this specific day"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Regenerate Day</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-full text-charcoal-400 hover:text-charcoal-800 hover:bg-ivory-200 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body Slots */}
      {isExpanded && (
        <div className="p-6">
          {renderSlot('morning', day.morning)}
          {renderSlot('afternoon', day.afternoon)}
          {renderSlot('evening', day.evening)}
        </div>
      )}
    </div>
  );
};

