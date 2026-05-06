import type { AppLocale } from '../types'

const EN: Record<string, string> = {
  'auth/email-already-in-use': 'This email is already registered',
  'auth/invalid-email': 'Invalid email address',
  'auth/weak-password': 'Password must be at least 6 characters',
  'auth/user-not-found': 'Incorrect email or password',
  'auth/wrong-password': 'Incorrect email or password',
  'auth/invalid-credential': 'Incorrect email or password',
  'auth/too-many-requests': 'Too many attempts. Try again later',
  'auth/popup-closed-by-user': 'Sign-in was cancelled',
}

const JA: Record<string, string> = {
  'auth/email-already-in-use': 'このメールアドレスは既に登録されています',
  'auth/invalid-email': 'メールアドレスの形式が正しくありません',
  'auth/weak-password': 'パスワードは6文字以上にしてください',
  'auth/user-not-found': 'メールまたはパスワードが違います',
  'auth/wrong-password': 'メールまたはパスワードが違います',
  'auth/invalid-credential': 'メールまたはパスワードが違います',
  'auth/too-many-requests': '試行回数が多すぎます。しばらく待ってから試してください',
  'auth/popup-closed-by-user': 'ログインがキャンセルされました',
}

export function mapAuthError(e: unknown, locale: AppLocale): string {
  if (e && typeof e === 'object' && 'code' in e) {
    const code = String((e as { code: string }).code)
    const table = locale === 'ja' ? JA : EN
    if (table[code]) return table[code]
    if (locale === 'ja' && EN[code]) return EN[code]
  }
  if (e instanceof Error) return e.message
  return locale === 'ja' ? 'エラーが発生しました' : 'Something went wrong'
}
