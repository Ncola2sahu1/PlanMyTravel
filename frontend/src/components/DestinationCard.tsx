import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, ArrowUpRight } from 'lucide-react';
import { Destination } from '../types';

interface Props {
  destination: Destination;
}

export const DestinationCard: React.FC<Props> = ({ destination }) => {
  const imageUrl =
    destination.hero_image_url ||
    destination.image_url ||
    (destination.gallery && destination.gallery[0]?.image_url) ||
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80';

  return (
    <Link
      to={`/destinations/${destination.slug}`}
      className="group block bg-white rounded-3xl border border-charcoal-100/90 overflow-hidden shadow-soft-sm hover:shadow-soft-lg hover:border-sage-200 transition-all duration-300"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ivory-200">
        <img
          src={imageUrl}
          alt={destination.name}
          loading="lazy"
          className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-105"
        />
        
        {/* Category Pill */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-white/90 backdrop-blur-md text-charcoal-800 shadow-soft-sm">
            {destination.category || 'Curated'}
          </span>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-semibold text-charcoal-900 shadow-soft-sm">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{destination.rating ? destination.rating.toFixed(1) : '4.9'}</span>
        </div>

        {/* Hover Arrow Overlay */}
        <div className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-forest-800 text-white flex items-center justify-center opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 shadow-soft">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-charcoal-400 font-medium mb-1">
            <MapPin className="w-3.5 h-3.5 text-sage-600" />
            <span>{destination.country || destination.region || 'International'}</span>
          </div>
          
          <h3 className="font-serif text-xl font-medium text-charcoal-900 group-hover:text-forest-800 transition-colors line-clamp-1">
            {destination.name}
          </h3>

          <p className="mt-1.5 text-xs text-charcoal-500 line-clamp-2 leading-relaxed">
            {destination.tagline || destination.short_description || destination.description}
          </p>
        </div>

        {/* Footer info: Duration and Budget */}
        <div className="mt-4 pt-3.5 border-t border-charcoal-100/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-charcoal-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-charcoal-400" />
            <span>{destination.ideal_stay || '3-5 days'}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-charcoal-400 uppercase tracking-wider block">Est. from</span>
            <span className="text-sm font-semibold text-charcoal-900">
              ₹{(destination.estimated_cost_min || 45000).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

      </div>
    </Link>
  );
};

