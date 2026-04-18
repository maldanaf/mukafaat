// In Next.js, static image imports return an object with { src, width, height }
// This declaration ensures TypeScript knows about the shape
declare module "*.png" {
  const value: { src: string; width: number; height: number };
  export default value;
}

declare module "*.jpg" {
  const value: { src: string; width: number; height: number };
  export default value;
}

declare module "*.jpeg" {
  const value: { src: string; width: number; height: number };
  export default value;
}

declare module "*.gif" {
  const value: { src: string; width: number; height: number };
  export default value;
}

declare module "*.svg" {
  const value: { src: string; width: number; height: number };
  export default value;
}

declare module "*.mp4" {
  const value: string;
  export default value;
}

declare module "*.webm" {
  const value: string;
  export default value;
}
