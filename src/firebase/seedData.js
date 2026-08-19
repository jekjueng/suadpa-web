import { doc, writeBatch, serverTimestamp, collection } from "firebase/firestore";
import { db } from "./config";

const categoriesRef = () => collection(db, "categories");
const chantsRef     = () => collection(db, "chants");

/**
 * Seeds 3 categories and 7 chants into Firestore atomically.
 * Uses pre-generated refs so all writes happen in a single batch commit.
 * Content uses real newline characters (\n) — rendered by whitespace-pre-line on the frontend.
 */
export async function seedInitialData() {
  // Pre-generate document refs (so we have IDs before writing)
  const cat1Ref = doc(categoriesRef());
  const cat2Ref = doc(categoriesRef());
  const cat3Ref = doc(categoriesRef());

  const batch = writeBatch(db);

  // ── Categories ──────────────────────────────────────────────────────────────

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

  // ── Chants ──────────────────────────────────────────────────────────────────

  // Category 1 — บทที่ 1
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

  // Category 1 — บทที่ 2
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

  // Category 1 — บทที่ 3
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

  // Category 2 — บทที่ 4
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

  // Category 3 — บทที่ 5
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

  // Category 3 — บทที่ 6
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

  // Category 3 — บทที่ 7
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

  await batch.commit();
}
