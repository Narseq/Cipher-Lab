import { randomBytes } from 'node:crypto';
import { db } from '../src/lib/db';
import { ensureAchievements } from '../src/lib/services/achievements';
import { createPuzzle } from '../src/lib/services/puzzles';
import { registerUser } from '../src/lib/services/users';
import { createPuzzleSchema } from '../src/lib/validation/puzzle';

const SAMPLES = [
  {
    cipherId: 'caesar',
    cipherOptions: { shift: 3 },
    plaintext: 'The quick brown fox jumps over the lazy dog',
    difficulty: 'easy',
    tags: ['beginner', 'cipher'],
    en: {
      title: 'Julius would approve',
      description: 'A message is making the rounds in the Roman forum.',
      explanation: 'Every letter was shifted three places forward (Caesar, shift 3).',
      hints: ['An emperor invented this one.', 'Try small shifts.'],
    },
    pl: {
      title: 'Juliusz byłby zadowolony',
      description: 'Po rzymskim forum krąży pewna wiadomość.',
      explanation: 'Każdą literę przesunięto o trzy miejsca do przodu (Caesar, przesunięcie 3).',
      hints: ['Wymyślił to pewien cesarz.', 'Wypróbuj małe przesunięcia.'],
    },
  },
  {
    cipherId: 'base64',
    cipherOptions: {},
    plaintext: 'Open source is a team sport',
    difficulty: 'easy',
    tags: ['beginner', 'encoding'],
    en: {
      title: 'Encoded, not encrypted',
      description: 'It looks random, but there is no key to find.',
      explanation: 'Plain Base64: the text was only re-encoded.',
      hints: ['Look at the characters it uses.'],
    },
    pl: {
      title: 'Zakodowane, nie zaszyfrowane',
      description: 'Wygląda losowo, ale nie ma tu żadnego klucza do znalezienia.',
      explanation: 'Zwykłe Base64: tekst został tylko zakodowany.',
      hints: ['Przyjrzyj się użytym znakom.'],
    },
  },
  {
    cipherId: 'morse',
    cipherOptions: {},
    plaintext: 'Meet at the old lighthouse',
    difficulty: 'easy',
    tags: ['story', 'classic'],
    en: {
      title: 'Signal from the lighthouse',
      description: 'A lamp blinked this pattern all night.',
      explanation: 'International Morse code; words are separated by a vertical bar.',
      hints: ['Short and long signals.'],
    },
    pl: {
      title: 'Sygnał z latarni',
      description: 'Lampa migała tym wzorem całą noc.',
      explanation: 'Międzynarodowy alfabet Morse’a; wyrazy rozdziela pionowa kreska.',
      hints: ['Krótkie i długie sygnały.'],
    },
  },
  {
    cipherId: 'vigenere',
    cipherOptions: { key: 'LEMON' },
    plaintext: 'Attack at dawn and bring the map',
    difficulty: 'medium',
    tags: ['logic', 'story'],
    en: {
      title: 'A fruity keyword',
      description: 'The spies agreed on a single word as their key.',
      explanation: 'Vigenère with the keyword LEMON.',
      hints: ['The key is a citrus fruit.', 'Five letters.'],
    },
    pl: {
      title: 'Owocowe hasło',
      description: 'Szpiedzy umówili się na jedno słowo jako klucz.',
      explanation: 'Vigenère ze słowem kluczowym LEMON.',
      hints: ['Kluczem jest owoc cytrusowy.', 'Pięć liter.'],
    },
  },
  {
    cipherId: 'xor',
    cipherOptions: { key: 'K' },
    plaintext: 'Bits flip, secrets stay',
    difficulty: 'hard',
    tags: ['hard', 'cipher'],
    en: {
      title: 'Exclusive or',
      description: 'Hexadecimal digits hide a message behind one character.',
      explanation: 'Every byte was XORed with the single-character key K.',
      hints: ['Convert hex to bytes first.', 'The key is one letter, uppercase.'],
    },
    pl: {
      title: 'Alternatywa wykluczająca',
      description: 'Cyfry szesnastkowe ukrywają wiadomość za jednym znakiem.',
      explanation: 'Każdy bajt zaszyfrowano operacją XOR z jednoznakowym kluczem K.',
      hints: ['Najpierw zamień szesnastkowe cyfry na bajty.', 'Klucz to jedna wielka litera.'],
    },
  },
] as const;

async function main() {
  await ensureAchievements();

  if ((await db.puzzle.count()) > 0) {
    console.log('Puzzles already exist, nothing to seed.');
    return;
  }

  const author = await registerUser({
    email: 'cipherlab@example.com',
    username: 'cipherlab',
    password: randomBytes(18).toString('base64url'),
  });

  for (const sample of SAMPLES) {
    await createPuzzle(
      author.id,
      createPuzzleSchema.parse({
        cipherId: sample.cipherId,
        cipherOptions: sample.cipherOptions,
        plaintext: sample.plaintext,
        difficulty: sample.difficulty,
        maxAttempts: null,
        timeLimitSeconds: null,
        originalLocale: 'en',
        translations: { en: sample.en, pl: sample.pl },
        tags: sample.tags,
      }),
    );
  }
  console.log(`Seeded ${SAMPLES.length} sample puzzles by "${author.username}".`);
}

main().finally(() => db.$disconnect());
