/**
 * Official Gtax Fiscal Year Master Generator (Years 2021 to 2086 BS)
 * Generates continuous official fiscal years covering 66 years (2021/22 to 2086/87 BS)
 * Preserves standard foreign-key IDs (2080/81 = 1, 2081/82 = 2 [Current], 2079/80 = 3, 2078/79 = 4, 2082/83 = 5).
 */

export interface SeedFiscalYear {
  id: number;
  code: string;
  fullname: string;
  date_from_bs: string;
  date_from_ad: string;
  date_to_ad: string;
  date_to_bs: string;
  is_deleted: boolean;
  insert_by: string;
  update_by: string;
  is_active: boolean;
}

export function generateFiscalYears2021To2086(): SeedFiscalYear[] {
  const predefinedKnownIds: Record<number, number> = {
    2080: 1,
    2081: 2,
    2079: 3,
    2078: 4,
    2082: 5
  };

  const list: SeedFiscalYear[] = [];
  let nextId = 6;

  for (let y = 2021; y <= 2086; y++) {
    const nextShort = String((y + 1) % 100).padStart(2, "0");
    const code = `${y}/${nextShort}`;
    const id = predefinedKnownIds[y] !== undefined ? predefinedKnownIds[y] : nextId++;
    const isCurrent = y === 2081;
    const isProjected = y > 2081;
    const tag = isCurrent ? " [Current]" : isProjected ? " [Projected]" : "";
    const fullname = `Fiscal Year ${y}/${y + 1} BS (आर्थिक वर्ष ${y}/${nextShort})${tag}`;
    const adStart = `${y - 57}-07-16`;
    const adEnd = `${y - 56}-07-15`;

    list.push({
      id,
      code,
      fullname,
      date_from_bs: `${y}-04-01`,
      date_from_ad: adStart,
      date_to_ad: adEnd,
      date_to_bs: `${y + 1}-03-31`,
      is_deleted: false,
      insert_by: "1",
      update_by: "1",
      is_active: true
    });
  }

  return list;
}
