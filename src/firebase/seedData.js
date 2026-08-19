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

// ── Helper: delete all docs in a collection (chunked, Firestore max 500/batch) ─

async function clearCollection(colRef) {
  const snap = await getDocs(colRef);
  if (snap.empty) return;

  const CHUNK = 490;
  for (let i = 0; i < snap.docs.length; i += CHUNK) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + CHUNK).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

// ── Seed payload ───────────────────────────────────────────────────────────────

/**
 * Clears existing categories + chants, then seeds 5 categories and 20 chants.
 * All writes in a single atomic batch after clearing.
 * Content uses real \n characters — rendered by whitespace-pre-line on frontend.
 */
export async function seedInitialData() {
  // 1. Clear existing data first to prevent duplicates
  await clearCollection(chantsRef());
  await clearCollection(categoriesRef());

  // 2. Pre-generate category refs (need IDs before writing)
  const cat1Ref = doc(categoriesRef()); // หมวดกราบไหว้และบูชาพระรัตนตรัย
  const cat2Ref = doc(categoriesRef()); // หมวดสรรเสริญพระรัตนตรัย
  const cat3Ref = doc(categoriesRef()); // หมวดแผ่เมตตาและอุทิศบุญ
  const cat4Ref = doc(categoriesRef()); // หมวดบูชาเทพเทวาและสิ่งศักดิ์สิทธิ์
  const cat5Ref = doc(categoriesRef()); // หมวดคาถาเสริมสิริมงคลและโชคลาภ

  const batch = writeBatch(db);

  // ── Categories ───────────────────────────────────────────────────────────────

  batch.set(cat1Ref, {
    name:        "หมวดกราบไหว้และบูชาพระรัตนตรัย",
    description: "บทสวดสำหรับการกราบไหว้และบูชาพระพุทธ พระธรรม พระสงฆ์",
    imageUrl:    "",
    order:       0,
    createdAt:   serverTimestamp(),
  });

  batch.set(cat2Ref, {
    name:        "หมวดสรรเสริญพระรัตนตรัย",
    description: "บทสวดสรรเสริญคุณของพระพุทธ พระธรรม พระสงฆ์",
    imageUrl:    "",
    order:       1,
    createdAt:   serverTimestamp(),
  });

  batch.set(cat3Ref, {
    name:        "หมวดแผ่เมตตาและอุทิศบุญ",
    description: "บทสวดแผ่เมตตาแก่ตนเอง สรรพสัตว์ และอุทิศบุญกุศล",
    imageUrl:    "",
    order:       2,
    createdAt:   serverTimestamp(),
  });

  batch.set(cat4Ref, {
    name:        "หมวดบูชาเทพเทวาและสิ่งศักดิ์สิทธิ์",
    description: "คาถาบูชาเทพเทวาและสิ่งศักดิ์สิทธิ์ต่างๆ",
    imageUrl:    "",
    order:       3,
    createdAt:   serverTimestamp(),
  });

  batch.set(cat5Ref, {
    name:        "หมวดคาถาเสริมสิริมงคลและโชคลาภ",
    description: "คาถาเสริมดวง เรียกทรัพย์ และเพิ่มสิริมงคล",
    imageUrl:    "",
    order:       4,
    createdAt:   serverTimestamp(),
  });

  // ── Chants: หมวด 1 ────────────────────────────────────────────────────────────

  batch.set(doc(chantsRef()), {
    title:       "คำบูชาพระรัตนตรัย",
    content:     "อิมินา สักกาเรนะ พุทธัง อะภิปูชะยามิ\nอิมินา สักกาเรนะ ธัมมัง อะภิปูชะยามิ\nอิมินา สักกาเรนะ สังฆัง อะภิปูชะยามิ",
    translation: "",
    categoryIds: [cat1Ref.id],
    status:      "published",
    order:       0,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  batch.set(doc(chantsRef()), {
    title:       "คำนมัสการพระพุทธเจ้า",
    content:     "นะโม ตัสสะ ภะคะวะโต อะระหะโต สัมมาสัมพุทธัสสะ (สวด 3 จบ)",
    translation: "",
    categoryIds: [cat1Ref.id],
    status:      "published",
    order:       1,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  batch.set(doc(chantsRef()), {
    title:       "บทไตรสรณคมน์",
    content:     "พุทธัง สะระณัง คัจฉามิ\nธัมมัง สะระณัง คัจฉามิ\nสังฆัง สะระณัง คัจฉามิ",
    translation: "",
    categoryIds: [cat1Ref.id],
    status:      "published",
    order:       2,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  // ── Chants: หมวด 2 ────────────────────────────────────────────────────────────

  batch.set(doc(chantsRef()), {
    title:       "บทอิติปิโส",
    content:     "อิติปิ โส ภะคะวา อะระหัง สัมมาสัมพุทโธ วิชชาจะระณะสัมปันโน สุคะโต โลกะวิทู อะนุตตะโร ปุริสะทัมมะสาระถิ สัตถา เทวะมะนุสสานัง พุทโธ ภะคะวาติ\nสวากขาโต ภะคะวะตา ธัมโม สันทิฏฐิโก อะกาลิโก เอหิปัสสิโก โอปะนะยิโก ปัจจัตตัง เวทิตัพโพ วิญญูหีติ\nสุปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ อุชุปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ ญายะปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ สามีจิปะฏิปันโน ภะคะวะโต สาวะกะสังโฆ ยะทิทัง จัตตาริ ปุริสะยุคานิ อัฏฐะ ปุริสะปุคคะลา เอสะ ภะคะวะโต สาวะกะสังโฆ อาหุเนยโย ปาหุเนยโย ทักขิเณยโย อัญชะลีกะระณีโย อะนุตตะรัง ปุญญักเขตตัง โลกัสสาติ",
    translation: "",
    categoryIds: [cat2Ref.id],
    status:      "published",
    order:       0,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  // ── Chants: หมวด 3 ────────────────────────────────────────────────────────────

  batch.set(doc(chantsRef()), {
    title:       "บทแผ่เมตตาแก่ตนเอง",
    content:     "อะหัง สุขิโต โหมิ (ขอให้ข้าพเจ้ามีความสุข)\nนิททุกโข โหมิ (ปราศจากความทุกข์)\nอะเวโร โหมิ (ปราศจากเวร)\nอัพยาปัชโฌ โหมิ (ปราศจากอุปสรรคอันตรายทั้งปวง)\nอะนีโฆ โหมิ (ปราศจากความทุกข์กายทุกข์ใจ)\nสุขี อัตตานัง ปะริหะรามิ (มีความสุขกายสุขใจ รักษาตนให้พ้นจากทุกข์ภัยทั้งสิ้นเถิด)",
    translation: "",
    categoryIds: [cat3Ref.id],
    status:      "published",
    order:       0,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  batch.set(doc(chantsRef()), {
    title:       "บทแผ่เมตตาให้สรรพสัตว์",
    content:     "สัพเพ สัตตา สัตว์ทั้งหลายที่เป็นเพื่อนทุกข์ เกิดแก่เจ็บตาย ด้วยกันทั้งหมดทั้งสิ้น\nอะเวรา โหนตุ จงเป็นสุขเป็นสุขเถิด อย่าได้มีเวรแก่กันและกันเลย\nอัพยาปัชฌา โหนตุ จงเป็นสุขเป็นสุขเถิด อย่าได้เบียดเบียนซึ่งกันและกันเลย\nอะนีฆา โหนตุ จงเป็นสุขเป็นสุขเถิด อย่าได้มีความทุกข์กายทุกข์ใจเลย\nสุขี อัตตานัง ปะริหะรันตุ จงมีความสุขกายสุขใจ รักษาตนให้พ้นจากทุกข์ภัยทั้งสิ้นเถิด",
    translation: "",
    categoryIds: [cat3Ref.id],
    status:      "published",
    order:       1,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  batch.set(doc(chantsRef()), {
    title:       "บทอุทิศส่วนกุศล",
    content:     "อิทัง เม ญาตีนัง โหตุ สุขิตา โหนตุ ญาตะโย\n(ขอส่วนบุญนี้จงสำเร็จแก่ญาติทั้งหลายของข้าพเจ้า ขอญาติทั้งหลายของข้าพเจ้าจงมีความสุข)",
    translation: "",
    categoryIds: [cat3Ref.id],
    status:      "published",
    order:       2,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  // ── Chants: หมวด 4 ────────────────────────────────────────────────────────────

  batch.set(doc(chantsRef()), {
    title:       "คาถาบูชาพระพิฆเนศ (เทพแห่งความสำเร็จ)",
    content:     "โอม ศรี คเณศายะ นะมะฮา (สวด 3 จบ)\nโอม พระพิฆเณศวร สิทธิประสิทธิเม มหาลาโภ\nทุติยัมปิ พระพิฆเณศวร สิทธิประสิทธิเม มหาลาโภ\nตะติยัมปิ พระพิฆเณศวร สิทธิประสิทธิเม มหาลาโภ",
    translation: "",
    categoryIds: [cat4Ref.id],
    status:      "published",
    order:       0,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  batch.set(doc(chantsRef()), {
    title:       "คาถาบูชาท้าวเวสสุวรรณ (ป้องกันภัยและเรียกทรัพย์)",
    content:     "อิติปิ โส ภะคะวา ยะมะราชาโน ท้าวเวสสุวัณโณ\nมะระณัง สุขัง อะหัง สุคะโต นะโม พุทธายะ\nท้าวเวสสุวัณโณ จาตุมะหาราชิกา ยักขะพันตาภัทภูริโต\nเวสสะ พุสะ พุทธัง อะระหัง พุทโธ ท้าวเวสสุวัณโณ นะโม พุทธายะ",
    translation: "",
    categoryIds: [cat4Ref.id],
    status:      "published",
    order:       1,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  batch.set(doc(chantsRef()), {
    title:       "คาถาบูชาพระพรหม (เทพแห่งความเมตตาและลิขิตชะตา)",
    content:     "โอม เอการะมาตา เอการะปิตา ปะโร มหายะเตมัง\nโอม พระพรหมา ปฏิพาหายะ\nทุติยัมปิ พระพรหมา ปฏิพาหายะ\nตะติยัมปิ พระพรหมา ปฏิพาหายะ",
    translation: "",
    categoryIds: [cat4Ref.id],
    status:      "published",
    order:       2,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  batch.set(doc(chantsRef()), {
    title:       "คาถาบูชาพระแม่ลักษมี (เทพีแห่งความมั่งคั่ง)",
    content:     "โอม ชยะ ศรี ลักษมี มาตา (สวด 3 จบ)\nโอม พระลักษมี อิตถีเทวะ เมตตัญจะ มหาลาโภ\nทุติยัมปิ พระลักษมี อิตถีเทวะ เมตตัญจะ มหาลาโภ\nตะติยัมปิ พระลักษมี อิตถีเทวะ เมตตัญจะ มหาลาโภ",
    translation: "",
    categoryIds: [cat4Ref.id],
    status:      "published",
    order:       3,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  batch.set(doc(chantsRef()), {
    title:       "คาถาบูชาพญานาค (ปู่ศรีสุทโธ)",
    content:     "กายะ วาจา จิตตัง อะหังวันทา นาคาธิบดีศรีสุทโธ วิสุทธิเทวาปูเชมิ\nทุติยัมปิ กายะ วาจา จิตตัง อะหังวันทา นาคาธิบดีศรีสุทโธ วิสุทธิเทวาปูเชมิ\nตะติยัมปิ กายะ วาจา จิตตัง อะหังวันทา นาคาธิบดีศรีสุทโธ วิสุทธิเทวาปูเชมิ",
    translation: "",
    categoryIds: [cat4Ref.id],
    status:      "published",
    order:       4,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  batch.set(doc(chantsRef()), {
    title:       "คาถาบูชาพระศิวะ (เทพแห่งการทำลายล้างสิ่งชั่วร้าย)",
    content:     "โอม นะมัส ศิวายะ (สวด 3 หรือ 9 จบ)",
    translation: "",
    categoryIds: [cat4Ref.id],
    status:      "published",
    order:       5,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  // ── Chants: หมวด 5 ────────────────────────────────────────────────────────────

  batch.set(doc(chantsRef()), {
    title:       "คาถาชินบัญชร (ฉบับย่อ)",
    content:     "ชินะปัญชะระปะริตตัง มังรักขะตุ สัพพะทา (สวด 9 จบ)",
    translation: "",
    categoryIds: [cat5Ref.id],
    status:      "published",
    order:       0,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  batch.set(doc(chantsRef()), {
    title:       "คาถาเงินล้าน (หลวงพ่อฤาษีลิงดำ)",
    content:     "สัมปะจิตฉามิ นาสังสิโม\nพรหมา จะ มหาเทวา สัพเพยักขา ปะลายันติ\nพรหมา จะ มหาเทวา อะภิลาภา ภะวันตุ เม\nมะหาปุญโญ มะหาลาโภ ภะวันตุ เม มิเตพาหุหะติ\nพุทธะมะอะอุ นะโมพุทธายะ วิระทะโย วิระโคนายัง วิระหิงสา\nวิระทาสี วิระทาสา วิระอิตถิโย พุทธัสสะ มานีมามะ พุทธัสสะ สะวาโหม\nสัมปะติจฉามิ เพ็ง ๆ พา ๆ หา ๆ ฤา ๆ",
    translation: "",
    categoryIds: [cat5Ref.id],
    status:      "published",
    order:       1,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  batch.set(doc(chantsRef()), {
    title:       "คาถามหาจักรพรรดิ (หลวงปู่ดู่)",
    content:     "นะโมพุทธายะ พระพุทธะ ไตรรัตนะ ญาณ\nมณีนพรัตน์ สีสะหัสสะ สุธรรมา\nพุทโธ ธัมโม สังโฆ ยะธาพุทโมนะ\nพุทธะบูชา ธัมมะบูชา สังฆะบูชา\nอัคคีทานัง วะรังคันธัง สีวะลี จะมหาเถรัง\nอะหังวันทามิ ทูระโต อะหังวันทามิ ธาตุโย\nอะหังวันทามิ สัพพะโส พุทธะ ธัมมะ สังฆะ ปูเชมิ",
    translation: "",
    categoryIds: [cat5Ref.id],
    status:      "published",
    order:       2,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  batch.set(doc(chantsRef()), {
    title:       "คาถาบูชาหลวงปู่ทวด (แคล้วคลาดปลอดภัย)",
    content:     "นะโม โพธิสัตโต อาคันติมายะ อิติภะคะวา (สวด 3 จบ)",
    translation: "",
    categoryIds: [cat5Ref.id],
    status:      "published",
    order:       3,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  batch.set(doc(chantsRef()), {
    title:       "คาถามหาลาภ หลวงพ่อรวย (วัดตะโก)",
    content:     "สัมพุทธิตา จะ ภะคะวานัง เอตะมังคะละมุตตะมัง\nสัพพะพุทธา นุภาเวนะ สัพพะธัมมา นุภาเวนะ สัพพะสังฆา นุภาเวนะ\nศิลป์ทานัง วะรังคันธัง มานิมามา ยะธาพุทโมนะ\nพุทธาพุทธา พุทเธพุทโธ พุทธังอะระหัง พุทโธ นะโมพุทธายะ",
    translation: "",
    categoryIds: [cat5Ref.id],
    status:      "published",
    order:       4,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  batch.set(doc(chantsRef()), {
    title:       "คาถาเรียกทรัพย์ (หลวงพ่อปาน)",
    content:     "พุทธะ มะอะอุ นะโมพุทธายะ (สวด 1 จบ)\nวิระทะโย วิระโคนายัง วิระหิงสา วิระทาสี วิระทาสา\nวิระอิตถิโย พุทธัสสะ มาณีมามะ พุทธัสสะ สะวาโหม (สวด 3 จบ)",
    translation: "",
    categoryIds: [cat5Ref.id],
    status:      "published",
    order:       5,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  batch.set(doc(chantsRef()), {
    title:       "คาถาสวดบูชาพระราหู (เสริมดวงชะตา พลิกร้ายกลายเป็นดี)",
    content:     "กินนุ สันตะระมาโน วะ ราหุ จันทัง ปะมุญจะสิ\nสังวิคคะรูโป อาคัมมะ กินนุ ภีโต วะ ติฏฐะสีติ\nสัตตะธา เม ผะเล มุทธา ชีวันโต นะ สุขัง ละเภ\nพุทธาคาถาภิคีโตมหิ โน เจ มุญเจยยะ จันทิมันติ",
    translation: "",
    categoryIds: [cat5Ref.id],
    status:      "published",
    order:       6,
    viewCount:   0,
    createdAt:   serverTimestamp(),
  });

  // 3. Commit everything atomically (25 writes — well within the 500-op limit)
  await batch.commit();
}
