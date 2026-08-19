import {
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
  collection,
} from "firebase/firestore";
import { db } from "./config";

const categoriesRef = () => collection(db, "categories");
const chantsRef     = () => collection(db, "chants");

function normalizeName(value) {
  return String(value ?? "").trim();
}

// ── Seed payload ───────────────────────────────────────────────────────────────

const SEED_CATEGORIES = [
  {
    key:         "cat1",
    name:        "หมวดกราบไหว้และบูชาพระรัตนตรัย",
    description: "บทสวดสำหรับการกราบไหว้และบูชาพระพุทธ พระธรรม พระสงฆ์",
    order:       0,
  },
  {
    key:         "cat2",
    name:        "หมวดสรรเสริญพระรัตนตรัย",
    description: "บทสวดสรรเสริญคุณของพระพุทธ พระธรรม พระสงฆ์",
    order:       1,
  },
  {
    key:         "cat3",
    name:        "หมวดแผ่เมตตาและอุทิศบุญ",
    description: "บทสวดแผ่เมตตาแก่ตนเอง สรรพสัตว์ และอุทิศบุญกุศล",
    order:       2,
  },
  {
    key:         "cat4",
    name:        "หมวดบูชาเทพเทวาและสิ่งศักดิ์สิทธิ์",
    description: "คาถาบูชาเทพเทวาและสิ่งศักดิ์สิทธิ์ต่างๆ",
    order:       3,
  },
  {
    key:         "cat5",
    name:        "หมวดคาถาเสริมสิริมงคลและโชคลาภ",
    description: "คาถาเสริมดวง เรียกทรัพย์ และเพิ่มสิริมงคล",
    order:       4,
  },
];

const SEED_CHANTS = [
  {
    categoryKey: "cat1",
    title:       "คำบูชาพระรัตนตรัย",
    content:     "อิมินา สักกาเรนะ พุทธัง อะภิปูชะยามิ\nอิมินา สักกาเรนะ ธัมมัง อะภิปูชะยามิ\nอิมินา สักกาเรนะ สังฆัง อะภิปูชะยามิ",
    order:       0,
  },
  {
    categoryKey: "cat1",
    title:       "คำนมัสการพระพุทธเจ้า",
    content:     "นะโม ตัสสะ ภะคะวะโต อะระหะโต สัมมาสัมพุทธัสสะ (สวด 3 จบ)",
    order:       1,
  },
  {
    categoryKey: "cat1",
    title:       "บทไตรสรณคมน์",
    content:     "พุทธัง สะระณัง คัจฉามิ\nธัมมัง สะระณัง คัจฉามิ\nสังฆัง สะระณัง คัจฉามิ",
    order:       2,
  },
  {
    categoryKey: "cat2",
    title:       "บทอิติปิโส",
    content:     "อิติปิ โส ภะคะวา อะระหัง สัมมาสัมพุทโธ วิชชาจะระณะสัมปันโน สุคะโต โลกะวิทู อะนุตตะโร ปุริสะทัมมะสาระถิ สัตถา เทวะมะนุสสานัง พุทโธ ภะคะวาติ\nสวากขาโต ภะคะวะตา ธัมโม สันทิฏฐิโก อะกาลิโก เอหิปัสสิโก โอปะนะยิโก ปัจจัตตัง เวทิตัพโพ วิญญูหีติ\nสุปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ อุชุปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ ญายะปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ สามีจิปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ ยะทิทัง จัตตาริ ปุริสะยุคานิ อัฏฐะ ปุริสะปุคคะลา เอสะ ภะคะวะโต สาวะกะสังโฆ อาหุเนยโย ปาหุเนยโย ทักขิเณยโย อัญชะลีกะระณีโย อะนุตตะรัง ปุญญักเขตตัง โลกัสสาติ",
    order:       0,
  },
  {
    categoryKey: "cat3",
    title:       "บทแผ่เมตตาแก่ตนเอง",
    content:     "อะหัง สุขิโต โหมิ (ขอให้ข้าพเจ้ามีความสุข)\nนิททุกโข โหมิ (ปราศจากความทุกข์)\nอะเวโร โหมิ (ปราศจากเวร)\nอัพยาปัชโฌ โหมิ (ปราศจากอุปสรรคอันตรายทั้งปวง)\nอะนีโฆ โหมิ (ปราศจากความทุกข์กายทุกข์ใจ)\nสุขี อัตตานัง ปะริหะรามิ (มีความสุขกายสุขใจ รักษาตนให้พ้นจากทุกข์ภัยทั้งสิ้นเถิด)",
    order:       0,
  },
  {
    categoryKey: "cat3",
    title:       "บทแผ่เมตตาให้สรรพสัตว์",
    content:     "สัพเพ สัตตา สัตว์ทั้งหลายที่เป็นเพื่อนทุกข์ เกิดแก่เจ็บตาย ด้วยกันทั้งหมดทั้งสิ้น\nอะเวรา โหนตุ จงเป็นสุขเป็นสุขเถิด อย่าได้มีเวรแก่กันและกันเลย\nอัพยาปัชฌา โหนตุ จงเป็นสุขเป็นสุขเถิด อย่าได้เบียดเบียนซึ่งกันและกันเลย\nอะนีฆา โหนตุ จงเป็นสุขเป็นสุขเถิด อย่าได้มีความทุกข์กายทุกข์ใจเลย\nสุขี อัตตานัง ปะริหะรันตุ จงมีความสุขกายสุขใจ รักษาตนให้พ้นจากทุกข์ภัยทั้งสิ้นเถิด",
    order:       1,
  },
  {
    categoryKey: "cat3",
    title:       "บทอุทิศส่วนกุศล",
    content:     "อิทัง เม ญาตีนัง โหตุ สุขิตา โหนตุ ญาตะโย\n(ขอส่วนบุญนี้จงสำเร็จแก่ญาติทั้งหลายของข้าพเจ้า ขอญาติทั้งหลายของข้าพเจ้าจงมีความสุข)",
    order:       2,
  },
  {
    categoryKey: "cat4",
    title:       "คาถาบูชาพระพิฆเนศ (เทพแห่งความสำเร็จ)",
    content:     "โอม ศรี คเณศายะ นะมะฮา (สวด 3 จบ)\nโอม พระพิฆเณศวร สิทธิประสิทธิเม มหาลาโภ\nทุติยัมปิ พระพิฆเณศวร สิทธิประสิทธิเม มหาลาโภ\nตะติยัมปิ พระพิฆเณศวร สิทธิประสิทธิเม มหาลาโภ",
    order:       0,
  },
  {
    categoryKey: "cat4",
    title:       "คาถาบูชาท้าวเวสสุวรรณ (ป้องกันภัยและเรียกทรัพย์)",
    content:     "อิติปิ โส ภะคะวา ยะมะราชาโน ท้าวเวสสุวัณโณ\nมะระณัง สุขัง อะหัง สุคะโต นะโม พุทธายะ\nท้าวเวสสุวัณโณ จาตุมะหาราชิกา ยักขะพันตาภัทภูริโต\nเวสสะ พุสะ พุทธัง อะระหัง พุทโธ ท้าวเวสสุวัณโณ นะโม พุทธายะ",
    order:       1,
  },
  {
    categoryKey: "cat4",
    title:       "คาถาบูชาพระพรหม (เทพแห่งความเมตตาและลิขิตชะตา)",
    content:     "โอม เอการะมาตา เอการะปิตา ปะโร มหายะเตมัง\nโอม พระพรหมา ปฏิพาหายะ\nทุติยัมปิ พระพรหมา ปฏิพาหายะ\nตะติยัมปิ พระพรหมา ปฏิพาหายะ",
    order:       2,
  },
  {
    categoryKey: "cat4",
    title:       "คาถาบูชาพระแม่ลักษมี (เทพีแห่งความมั่งคั่ง)",
    content:     "โอม ชยะ ศรี ลักษมี มาตา (สวด 3 จบ)\nโอม พระลักษมี อิตถีเทวะ เมตตัญจะ มหาลาโภ\nทุติยัมปิ พระลักษมี อิตถีเทวะ เมตตัญจะ มหาลาโภ\nตะติยัมปิ พระลักษมี อิตถีเทวะ เมตตัญจะ มหาลาโภ",
    order:       3,
  },
  {
    categoryKey: "cat4",
    title:       "คาถาบูชาพญานาค (ปู่ศรีสุทโธ)",
    content:     "กายะ วาจา จิตตัง อะหังวันทา นาคาธิบดีศรีสุทโธ วิสุทธิเทวาปูเชมิ\nทุติยัมปิ กายะ วาจา จิตตัง อะหังวันทา นาคาธิบดีศรีสุทโธ วิสุทธิเทวาปูเชมิ\nตะติยัมปิ กายะ วาจา จิตตัง อะหังวันทา นาคาธิบดีศรีสุทโธ วิสุทธิเทวาปูเชมิ",
    order:       4,
  },
  {
    categoryKey: "cat4",
    title:       "คาถาบูชาพระศิวะ (เทพแห่งการทำลายล้างสิ่งชั่วร้าย)",
    content:     "โอม นะมัส ศิวายะ (สวด 3 หรือ 9 จบ)",
    order:       5,
  },
  {
    categoryKey: "cat5",
    title:       "คาถาชินบัญชร (ฉบับย่อ)",
    content:     "ชินะปัญชะระปะริตตัง มังรักขะตุ สัพพะทา (สวด 9 จบ)",
    order:       0,
  },
  {
    categoryKey: "cat5",
    title:       "คาถาเงินล้าน (หลวงพ่อฤาษีลิงดำ)",
    content:     "สัมปะจิตฉามิ นาสังสิโม\nพรหมา จะ มหาเทวา สัพเพยักขา ปะลายันติ\nพรหมา จะ มหาเทวา อะภิลาภา ภะวันตุ เม\nมะหาปุญโญ มะหาลาโภ ภะวันตุ เม มิเตพาหุหะติ\nพุทธะมะอะอุ นะโมพุทธายะ วิระทะโย วิระโคนายัง วิระหิงสา\nวิระทาสี วิระทาสา วิระอิตถิโย พุทธัสสะ มานีมามะ พุทธัสสะ สะวาโหม\nสัมปะติจฉามิ เพ็ง ๆ พา ๆ หา ๆ ฤา ๆ",
    order:       1,
  },
  {
    categoryKey: "cat5",
    title:       "คาถามหาจักรพรรดิ (หลวงปู่ดู่)",
    content:     "นะโมพุทธายะ พระพุทธะ ไตรรัตนะ ญาณ\nมณีนพรัตน์ สีสะหัสสะ สุธรรมา\nพุทโธ ธัมโม สังโฆ ยะธาพุทโมนะ\nพุทธะบูชา ธัมมะบูชา สังฆะบูชา\nอัคคีทานัง วะรังคันธัง สีวะลี จะมหาเถรัง\nอะหังวันทามิ ทูระโต อะหังวันทามิ ธาตุโย\nอะหังวันทามิ สัพพะโส พุทธะ ธัมมะ สังฆะ ปูเชมิ",
    order:       2,
  },
  {
    categoryKey: "cat5",
    title:       "คาถาบูชาหลวงปู่ทวด (แคล้วคลาดปลอดภัย)",
    content:     "นะโม โพธิสัตโต อาคันติมายะ อิติภะคะวา (สวด 3 จบ)",
    order:       3,
  },
  {
    categoryKey: "cat5",
    title:       "คาถามหาลาภ หลวงพ่อรวย (วัดตะโก)",
    content:     "สัมพุทธิตา จะ ภะคะวานัง เอตะมังคะละมุตตะมัง\nสัพพะพุทธา นุภาเวนะ สัพพะธัมมา นุภาเวนะ สัพพะสังฆา นุภาเวนะ\nศิลป์ทานัง วะรังคันธัง มานิมามา ยะธาพุทโมนะ\nพุทธาพุทธา พุทเธพุทโธ พุทธังอะระหัง พุทโธ นะโมพุทธายะ",
    order:       4,
  },
  {
    categoryKey: "cat5",
    title:       "คาถาเรียกทรัพย์ (หลวงพ่อปาน)",
    content:     "พุทธะ มะอะอุ นะโมพุทธายะ (สวด 1 จบ)\nวิระทะโย วิระโคนายัง วิระหิงสา วิระทาสี วิระทาสา\nวิระอิตถิโย พุทธัสสะ มาณีมามะ พุทธัสสะ สะวาโหม (สวด 3 จบ)",
    order:       5,
  },
  {
    categoryKey: "cat5",
    title:       "คาถาสวดบูชาพระราหู (เสริมดวงชะตา พลิกร้ายกลายเป็นดี)",
    content:     "กินนุ สันตะระมาโน วะ ราหุ จันทัง ปะมุญจะสิ\nสังวิคคะรูโป อาคัมมะ กินนุ ภีโต วะ ติฏฐะสีติ\nสัตตะธา เม ผะเล มุทธา ชีวันโต นะ สุขัง ละเภ\nพุทธาคาถาภิคีโตมหิ โน เจ มุญเจยยะ จันทิมันติ",
    order:       6,
  },
];

/**
 * Seeds 5 categories and 20 chants.
 * Duplicate check: fetch existing docs once, then skip by category.name / chant.title.
 * Returns { added, skipped, addedCategories, skippedCategories, addedChants, skippedChants }.
 */
export async function seedInitialData() {
  const [catsSnap, chantsSnap] = await Promise.all([
    getDocs(categoriesRef()),
    getDocs(chantsRef()),
  ]);

  const existingCategories = catsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const existingChants     = chantsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const categoryIdsByKey = {};
  let addedCategories    = 0;
  let skippedCategories  = 0;
  let addedChants        = 0;
  let skippedChants      = 0;

  const batch = writeBatch(db);

  for (const cat of SEED_CATEGORIES) {
    const found = existingCategories.find(
      (c) => normalizeName(c.name) === normalizeName(cat.name)
    );
    if (found) {
      categoryIdsByKey[cat.key] = found.id;
      skippedCategories += 1;
      continue;
    }

    const newRef = doc(categoriesRef());
    categoryIdsByKey[cat.key] = newRef.id;
    batch.set(newRef, {
      name:        cat.name,
      description: cat.description,
      imageUrl:    "",
      order:       cat.order,
      createdAt:   serverTimestamp(),
    });
    addedCategories += 1;
  }

  for (const chant of SEED_CHANTS) {
    const found = existingChants.find(
      (c) => normalizeName(c.title) === normalizeName(chant.title)
    );
    if (found) {
      skippedChants += 1;
      continue;
    }

    const categoryId = categoryIdsByKey[chant.categoryKey];
    batch.set(doc(chantsRef()), {
      title:       chant.title,
      content:     chant.content,
      translation: "",
      categoryIds: categoryId ? [categoryId] : [],
      status:      "published",
      order:       chant.order,
      viewCount:   0,
      createdAt:   serverTimestamp(),
    });
    addedChants += 1;
  }

  if (addedCategories + addedChants > 0) {
    await batch.commit();
  }

  return {
    added:              addedCategories + addedChants,
    skipped:            skippedCategories + skippedChants,
    addedCategories,
    skippedCategories,
    addedChants,
    skippedChants,
  };
}
