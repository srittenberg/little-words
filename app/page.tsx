import PasswordGate from '@/components/PasswordGate';
import SoundboardWithData from '@/components/SoundboardWithData';
import { getWords } from '@/lib/data';

export default function Home() {
  // Get initial words server-side for fast first render
  const initialWords = getWords();

  return (
    <PasswordGate>
      <SoundboardWithData initialWords={initialWords} />
    </PasswordGate>
  );
}
