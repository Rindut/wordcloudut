declare module 'wordcloud' {
  export interface WordCloudOptions {
    list: [string, number][];
    fontFamily?: string;
    fontWeight?: string;
    color?: string | ((word: string, weight: number, fontSize: number, distance: number, theta: number) => string);
    backgroundColor?: string;
    click?: ((item: [string, number] | null) => void) | undefined;
    gridSize?: number;
    weightFactor?: number;
    rotationSteps?: number;
    rotation?: number | ((() => number) | number);
    drawOutOfBound?: boolean;
    shrinkToFit?: boolean;
    shuffle?: boolean;
    shape?: string;
    ellipticity?: number;
    classes?: string;
    minSize?: number;
    clearCanvas?: boolean;
  }

  interface WordCloud {
    (canvas: HTMLCanvasElement, options: WordCloudOptions): void;
    default(canvas: HTMLCanvasElement, options: WordCloudOptions): void;
  }

  const WordCloud: WordCloud;
  export default WordCloud;
}

