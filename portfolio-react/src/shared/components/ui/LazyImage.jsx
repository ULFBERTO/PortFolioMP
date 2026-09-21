import { memo, useState } from 'react';

/**
 * Imagen con lazy nativo + blur-up + decoding async.
 * Uso: <LazyImage src alt className />
 */
export const LazyImage = memo(function LazyImage({ src, alt, className = '', eager = false }) {
  const [loaded, setLoaded] = useState(false);
  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      // eslint-disable-next-line react/no-unknown-property
      fetchpriority={eager ? 'high' : 'auto'}
      onLoad={() => setLoaded(true)}
      className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
      draggable={false}
    />
  );
});
