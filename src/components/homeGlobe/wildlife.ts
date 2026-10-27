import type { Biome } from "./landscapes";
import type { WildlifeBehaviour } from "./wildlifeAnimation";

// Native species per destination. Paths point at public/globe-kit.
export type Animal = {
  src: string;
  h: number;
  aspect: number;
  at: [number, number][];
  shore?: boolean;
  foot?: number;
  behaviour?: WildlifeBehaviour;
};

const W = "/globe-kit/wildlife";

export const wildlife: Record<Biome, Animal[]> = {
  forest: [
    {
      src: `${W}/tiger.png`,
      foot: 0.042,
      h: 1.7,
      aspect: 1.83,
      at: [[12, -34]],
    },
    {
      src: `${W}/indian-elephant-standing.png`,
      foot: 0,
      h: 3.4,
      aspect: 1.30223,
      at: [[21, -78]],
      behaviour: "standing-elephant",
    },
    {
      src: `${W}/indian-elephant-resting.png`,
      foot: 0,
      h: 1.75,
      aspect: 2.49322,
      at: [[25, -83]],
      behaviour: "resting-elephant",
    },
    {
      src: `${W}/chital-grazing.png`,
      foot: 0,
      h: 1.7,
      aspect: 1.26239,
      at: [
        [19, -43],
        [21, -44.5],
        [22.5, -42],
        [20, -46],
        [8, -84],
        [10.5, -86],
        [6.5, -87.5],
      ],
      behaviour: "grazing-deer",
    },
  ],
  volcanic: [
    {
      src: `${W}/tortoise.png`,
      foot: 0.106,
      h: 1.4,
      aspect: 1.48,
      at: [
        [4, -28],
        [-6, -36],
      ],
    },
    {
      src: `${W}/iguana.png`,
      foot: 0.214,
      h: 0.9,
      aspect: 1.48,
      at: [
        [14, -24],
        [15.5, -25],
        [13, -26.5],
      ],
      shore: true,
    },
    {
      src: `${W}/sealion.png`,
      foot: 0.052,
      h: 1.4,
      aspect: 1.48,
      at: [
        [20, -30],
        [22, -33],
      ],
      shore: true,
    },
  ],
  savannah: [
    {
      src: `${W}/african-elephant.png`,
      foot: 0.068,
      h: 4.4,
      aspect: 1.19,
      at: [
        [-8, -55],
        [-3, -58],
        [-12, -60],
      ],
    },
    {
      src: `${W}/giraffe.png`,
      foot: 0.028,
      h: 6.5,
      aspect: 0.68,
      at: [
        [24, -50],
        [28, -56],
      ],
    },
    {
      src: `${W}/zebra.png`,
      foot: 0.048,
      h: 2.1,
      aspect: 1.24,
      at: [
        [6, -38],
        [9, -40],
        [4, -42],
        [11, -36],
        [7, -44],
      ],
    },
    {
      src: `${W}/lion.png`,
      foot: 0.1,
      h: 1.8,
      aspect: 1.48,
      at: [
        [16, -30],
        [18, -31],
      ],
    },
  ],
  arctic: [
    {
      src: `${W}/polarbear.png`,
      foot: 0.14,
      h: 2.2,
      aspect: 1.48,
      at: [[14, -40]],
      shore: true,
    },
    {
      src: `${W}/walrus.png`,
      foot: 0.199,
      h: 1.6,
      aspect: 1.48,
      at: [
        [-4, -46],
        [-1, -48],
        [-6, -49],
      ],
      shore: true,
    },
    {
      src: `${W}/reindeer.png`,
      foot: 0.049,
      h: 1.9,
      aspect: 1,
      at: [
        [22, -32],
        [25, -35],
      ],
    },
  ],
};
