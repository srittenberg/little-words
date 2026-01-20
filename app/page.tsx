import PasswordGate from '@/components/PasswordGate';
import Soundboard from '@/components/Soundboard';
import { getWords } from '@/lib/data';

export default function Home() {
  const words = getWords();

  return (
    <PasswordGate>
      <Soundboard words={words} />
    </PasswordGate>
  );
}
