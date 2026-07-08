import { bumpStudySession } from "@/modules/study-sessions";

function todayKey() {
  // Día LOCAL del usuario, no UTC: con toISOString(), estudiar a la 1:30 de
  // la madrugada en España contaba como el día siguiente y rompía rachas.
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export async function bumpStudyToday(
  delta: {
    reviews?: number;
    wordsAdded?: number;
    readingMinutes?: number;
  } = {},
) {
  const day = todayKey();
  const { reviews = 0, wordsAdded = 0, readingMinutes = 0 } = delta;

  try {
    await bumpStudySession({ day, reviews, wordsAdded, readingMinutes });
  } catch (e) {
    console.warn("bumpStudyToday failed", e);
  }
}
