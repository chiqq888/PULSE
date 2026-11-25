import { useEffect, useState } from 'react';

const FALLBACK_POSTER = '/images/poster-fallback.png';

export function PosterImage({ src, alt, className = '' }) {
  const normalizedSrc = String(src || '').trim();
  const [imgSrc, setImgSrc] = useState(normalizedSrc || FALLBACK_POSTER);

  useEffect(() => {
    setImgSrc(normalizedSrc || FALLBACK_POSTER);
  }, [normalizedSrc]);

  const handleError = () => {
    if (imgSrc !== FALLBACK_POSTER) {
      setImgSrc(FALLBACK_POSTER);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt || 'Event poster'}
      className={className}
      loading="lazy"
      onError={handleError}
    />
  );
}
