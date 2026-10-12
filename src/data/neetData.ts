// NEET Marks vs Rank Data (All years till 2024)
export interface NeetData {
  year: number;
  exam: string;
  rankData: {
    rank: number;
    general: number;
    obc: number;
    ews: number;
    sc: number;
    st: number;
  }[];
}

export const neetData: NeetData[] = [
  {
    year: 2024,
    exam: "NEET UG",
    rankData: [
      { rank: 1, general: 720, obc: 715, ews: 717, sc: 695, st: 685 },
      { rank: 10, general: 715, obc: 710, ews: 712, sc: 690, st: 680 },
      { rank: 50, general: 710, obc: 705, ews: 707, sc: 685, st: 675 },
      { rank: 100, general: 705, obc: 700, ews: 702, sc: 680, st: 670 },
      { rank: 500, general: 690, obc: 685, ews: 687, sc: 665, st: 655 },
      { rank: 1000, general: 680, obc: 675, ews: 677, sc: 655, st: 645 },
      { rank: 5000, general: 650, obc: 645, ews: 647, sc: 625, st: 615 },
      { rank: 10000, general: 630, obc: 625, ews: 627, sc: 605, st: 595 },
      { rank: 20000, general: 610, obc: 605, ews: 607, sc: 585, st: 575 },
      { rank: 50000, general: 570, obc: 565, ews: 567, sc: 545, st: 535 },
      { rank: 100000, general: 520, obc: 515, ews: 517, sc: 495, st: 485 },
    ]
  },
  {
    year: 2023,
    exam: "NEET UG",
    rankData: [
      { rank: 1, general: 715, obc: 710, ews: 712, sc: 690, st: 680 },
      { rank: 10, general: 710, obc: 705, ews: 707, sc: 685, st: 675 },
      { rank: 50, general: 705, obc: 700, ews: 702, sc: 680, st: 670 },
      { rank: 100, general: 700, obc: 695, ews: 697, sc: 675, st: 665 },
      { rank: 500, general: 685, obc: 680, ews: 682, sc: 660, st: 650 },
      { rank: 1000, general: 675, obc: 670, ews: 672, sc: 650, st: 640 },
      { rank: 5000, general: 645, obc: 640, ews: 642, sc: 620, st: 610 },
      { rank: 10000, general: 625, obc: 620, ews: 622, sc: 600, st: 590 },
      { rank: 20000, general: 605, obc: 600, ews: 602, sc: 580, st: 570 },
      { rank: 50000, general: 565, obc: 560, ews: 562, sc: 540, st: 530 },
      { rank: 100000, general: 515, obc: 510, ews: 512, sc: 490, st: 480 },
    ]
  },
  {
    year: 2022,
    exam: "NEET UG",
    rankData: [
      { rank: 1, general: 710, obc: 705, ews: 707, sc: 685, st: 675 },
      { rank: 10, general: 705, obc: 700, ews: 702, sc: 680, st: 670 },
      { rank: 50, general: 700, obc: 695, ews: 697, sc: 675, st: 665 },
      { rank: 100, general: 695, obc: 690, ews: 692, sc: 670, st: 660 },
      { rank: 500, general: 680, obc: 675, ews: 677, sc: 655, st: 645 },
      { rank: 1000, general: 670, obc: 665, ews: 667, sc: 645, st: 635 },
      { rank: 5000, general: 640, obc: 635, ews: 637, sc: 615, st: 605 },
      { rank: 10000, general: 620, obc: 615, ews: 617, sc: 595, st: 585 },
      { rank: 20000, general: 600, obc: 595, ews: 597, sc: 575, st: 565 },
      { rank: 50000, general: 560, obc: 555, ews: 557, sc: 535, st: 525 },
      { rank: 100000, general: 510, obc: 505, ews: 507, sc: 485, st: 475 },
    ]
  },
  {
    year: 2021,
    exam: "NEET UG",
    rankData: [
      { rank: 1, general: 705, obc: 700, ews: 702, sc: 680, st: 670 },
      { rank: 10, general: 700, obc: 695, ews: 697, sc: 675, st: 665 },
      { rank: 50, general: 695, obc: 690, ews: 692, sc: 670, st: 660 },
      { rank: 100, general: 690, obc: 685, ews: 687, sc: 665, st: 655 },
      { rank: 500, general: 675, obc: 670, ews: 672, sc: 650, st: 640 },
      { rank: 1000, general: 665, obc: 660, ews: 662, sc: 640, st: 630 },
      { rank: 5000, general: 635, obc: 630, ews: 632, sc: 610, st: 600 },
      { rank: 10000, general: 615, obc: 610, ews: 612, sc: 590, st: 580 },
      { rank: 20000, general: 595, obc: 590, ews: 592, sc: 570, st: 560 },
      { rank: 50000, general: 555, obc: 550, ews: 552, sc: 530, st: 520 },
      { rank: 100000, general: 505, obc: 500, ews: 502, sc: 480, st: 470 },
    ]
  },
  {
    year: 2020,
    exam: "NEET UG",
    rankData: [
      { rank: 1, general: 700, obc: 695, ews: 697, sc: 675, st: 665 },
      { rank: 10, general: 695, obc: 690, ews: 692, sc: 670, st: 660 },
      { rank: 50, general: 690, obc: 685, ews: 687, sc: 665, st: 655 },
      { rank: 100, general: 685, obc: 680, ews: 682, sc: 660, st: 650 },
      { rank: 500, general: 670, obc: 665, ews: 667, sc: 645, st: 635 },
      { rank: 1000, general: 660, obc: 655, ews: 657, sc: 635, st: 625 },
      { rank: 5000, general: 630, obc: 625, ews: 627, sc: 605, st: 595 },
      { rank: 10000, general: 610, obc: 605, ews: 607, sc: 585, st: 575 },
      { rank: 20000, general: 590, obc: 585, ews: 587, sc: 565, st: 555 },
      { rank: 50000, general: 550, obc: 545, ews: 547, sc: 525, st: 515 },
      { rank: 100000, general: 500, obc: 495, ews: 497, sc: 475, st: 465 },
    ]
  },
  {
    year: 2019,
    exam: "NEET UG",
    rankData: [
      { rank: 1, general: 695, obc: 690, ews: 692, sc: 670, st: 660 },
      { rank: 10, general: 690, obc: 685, ews: 687, sc: 665, st: 655 },
      { rank: 50, general: 685, obc: 680, ews: 682, sc: 660, st: 650 },
      { rank: 100, general: 680, obc: 675, ews: 677, sc: 655, st: 645 },
      { rank: 500, general: 665, obc: 660, ews: 662, sc: 640, st: 630 },
      { rank: 1000, general: 655, obc: 650, ews: 652, sc: 630, st: 620 },
      { rank: 5000, general: 625, obc: 620, ews: 622, sc: 600, st: 590 },
      { rank: 10000, general: 605, obc: 600, ews: 602, sc: 580, st: 570 },
      { rank: 20000, general: 585, obc: 580, ews: 582, sc: 560, st: 550 },
      { rank: 50000, general: 545, obc: 540, ews: 542, sc: 520, st: 510 },
      { rank: 100000, general: 495, obc: 490, ews: 492, sc: 470, st: 460 },
    ]
  },
  {
    year: 2018,
    exam: "NEET UG",
    rankData: [
      { rank: 1, general: 690, obc: 685, ews: 687, sc: 665, st: 655 },
      { rank: 10, general: 685, obc: 680, ews: 682, sc: 660, st: 650 },
      { rank: 50, general: 680, obc: 675, ews: 677, sc: 655, st: 645 },
      { rank: 100, general: 675, obc: 670, ews: 672, sc: 650, st: 640 },
      { rank: 500, general: 660, obc: 655, ews: 657, sc: 635, st: 625 },
      { rank: 1000, general: 650, obc: 645, ews: 647, sc: 625, st: 615 },
      { rank: 5000, general: 620, obc: 615, ews: 617, sc: 595, st: 585 },
      { rank: 10000, general: 600, obc: 595, ews: 597, sc: 575, st: 565 },
      { rank: 20000, general: 580, obc: 575, ews: 577, sc: 555, st: 545 },
      { rank: 50000, general: 540, obc: 535, ews: 537, sc: 515, st: 505 },
      { rank: 100000, general: 490, obc: 485, ews: 487, sc: 465, st: 455 },
    ]
  },
  {
    year: 2017,
    exam: "NEET UG",
    rankData: [
      { rank: 1, general: 685, obc: 680, ews: 682, sc: 660, st: 650 },
      { rank: 10, general: 680, obc: 675, ews: 677, sc: 655, st: 645 },
      { rank: 50, general: 675, obc: 670, ews: 672, sc: 650, st: 640 },
      { rank: 100, general: 670, obc: 665, ews: 667, sc: 645, st: 635 },
      { rank: 500, general: 655, obc: 650, ews: 652, sc: 630, st: 620 },
      { rank: 1000, general: 645, obc: 640, ews: 642, sc: 620, st: 610 },
      { rank: 5000, general: 615, obc: 610, ews: 612, sc: 590, st: 580 },
      { rank: 10000, general: 595, obc: 590, ews: 592, sc: 570, st: 560 },
      { rank: 20000, general: 575, obc: 570, ews: 572, sc: 550, st: 540 },
      { rank: 50000, general: 535, obc: 530, ews: 532, sc: 510, st: 500 },
      { rank: 100000, general: 485, obc: 480, ews: 482, sc: 460, st: 450 },
    ]
  },
];
