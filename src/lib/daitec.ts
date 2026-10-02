const DAITEC_CONTRACT_BASE_URL =
  'https://dx1.kensetsu-cloud.jp/main/dxapp/t/X201E86/member/ledgeritemtemplate/chumonkeiyaku/list';

/** ダイテック注文分譲クラウドDXの、注文契約台帳の詳細ページへのURLを組み立てる（営業アプリと同じ形）。 */
export function daitecContractUrl(ledgerId: string): string {
  const params = new URLSearchParams({
    viewid: '2109393',
    ledgerId,
    tabName: 'CONTRACT_TAB',
  });
  return `${DAITEC_CONTRACT_BASE_URL}?${params.toString()}`;
}

/**
 * 入力された台帳IDを取り出す。数字だけでも、ダイテックの画面のURLをそのまま貼り付けてもよい。
 * 空なら null、読み取れなければ 'invalid'。
 */
export function parseDaitecLedgerId(input: string | null): string | null | 'invalid' {
  if (!input) return null;
  const s = input.trim().replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  if (/^\d+$/.test(s)) return s;
  const m = s.match(/[?&#]ledgerId=(\d+)/);
  return m ? m[1] : 'invalid';
}
