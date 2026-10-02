// JDLの文字数制限（全角12文字＝24バイトなど）は Shift_JIS のバイト数で数える。
// 半角英数・半角カナは1、それ以外は2として数える（ブラウザ側でも使うので iconv は使わない）。

export function sjisBytes(s: string): number {
  let n = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    n += c <= 0x7e || (c >= 0xff61 && c <= 0xff9f) ? 1 : 2;
  }
  return n;
}

/** 工事名は全角12文字まで */
export const NAME_MAX_BYTES = 24;
/** 契約先名は全角10文字まで */
export const CLIENT_NAME_MAX_BYTES = 20;
