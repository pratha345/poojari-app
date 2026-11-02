// 3D illustrated icon from /public/icons (96 & 192 px WebP, transparent background).
// `name` is the file stem, e.g. "3d/nav-havan" or "tabs/panchang"; `size` is the CSS
// pixel size. The browser picks the 192 px file on high-density screens.
export default function Icon3D({ name, size = 40, alt = '', className, style }) {
  return (
    <img
      src={`/icons/${name}-96.webp`}
      srcSet={`/icons/${name}-96.webp 96w, /icons/${name}-192.webp 192w`}
      sizes={`${size}px`}
      width={size}
      height={size}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable="false"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain', flexShrink: 0, ...style }}
    />
  );
}
