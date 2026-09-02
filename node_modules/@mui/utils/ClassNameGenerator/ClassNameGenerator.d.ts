declare const defaultGenerator: (componentName: string) => string;
declare const ClassNameGenerator: {
  configure(generator: typeof defaultGenerator): void;
  generate(componentName: string): string;
  reset(): void;
};
export default ClassNameGenerator;