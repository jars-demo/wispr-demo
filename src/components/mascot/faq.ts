// Fixed answers for the mascot. Keep them short, true and in plain words.

export const MASCOT_FAQ: { question: string; answer: string }[] = [
  {
    question: 'What is Receipts?',
    answer:
      'You say what you want built, Receipts turns it into a checklist for your coding agent, and then checks the agent’s work against it with the exact lines as proof.',
  },
  {
    question: 'How do I talk to it?',
    answer:
      'With Wispr Flow: click the box, hold Fn on Mac or Ctrl + Win on Windows, and talk. Flow types your words in. Typing works too.',
  },
  {
    question: 'How does the check work?',
    answer:
      'Paste the git diff or a public GitHub link, plus what your agent said. Each item comes back Found, Partly, Missing or Can’t tell. A Found always points to real lines.',
  },
  {
    question: 'Can it catch fibbing agents?',
    answer:
      'Yes. If the agent says “added tests” but no test files changed, you get “Not true”. “Tests pass” is only backed up by real test output.',
  },
  {
    question: 'Is my code stored?',
    answer:
      'No. Only the result is saved, with short quotes. Your checklists belong to your browser, and you can delete them any time.',
  },
  {
    question: 'Is it free?',
    answer: 'Yes, free with no sign-up. It was built for No Hands: The Wispr Challenge.',
  },
]
