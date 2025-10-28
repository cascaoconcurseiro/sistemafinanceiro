/**
 * Componente de Imagem Otimizada
 * Wrapper para next/image com configurações padrão
 */

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallback?: string;
}

export function OptimizedImage({
  src,
  alt,
  fallback = '/images/placeholder.png',
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(fallback);
          setIsLoading(false);
        }}
        loading="lazy"
        quality={85}
        {...props}
      />
    </div>
  );
}

/**
 * Avatar otimizado
 */
export function OptimizedAvatar({
  src,
  name,
  size = 40,
}: {
  src?: string;
  name: string;
  size?: number;
}) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (!src) {
    return (
      <div
        className="flex items-center justify-center bg-blue-600 text-white font-bold rounded-full"
        style={{ width: size, height: size, fontSize: size / 2.5 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-cover"
    />
  );
}
