# BlueWords 💙

**A simple and modern vocabulary tracker to help you learn, organize, and master English words.**

BlueWords is a responsive web application built with Next.js, TypeScript, and Tailwind CSS. It helps users manage their vocabulary, track learning progress, and build a consistent learning habit.

### 🔗 Live Demo

**[Try BlueWords](https://bluewords.vercel.app)**

### ✨ Features

- **Vocabulary Management** — Add, edit, and delete vocabulary words.
- **Learning Status** — Mark words as Learning or Mastered.
- **Smart Search** — Search words by English vocabulary or meaning.
- **Category Filtering** — Organize words into Daily, Work, and Frontend categories.
- **Dashboard Overview** — View total words, mastered words, and learning progress.
- **Recent Words** — Quickly review recently added vocabulary.
- **Local Storage** — Keep vocabulary data after refreshing the browser.
- **Responsive Design** — Optimized for desktop, tablet, and mobile.
- **User-Friendly Interactions** — Confirmation dialogs, toast notifications, and accessible modal interactions.

### 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js (App Router) | React framework |
| React | UI development |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| React Context API | State management |
| Local Storage | Browser data persistence |
| Radix UI Dialog | Accessible dialogs |
| Lucide React | Icons |
| Sonner | Toast notifications |
| Vercel | Deployment |

### 🚀 Getting Started

**1. Clone the repository**

```bash
git clone https://github.com/itcoding2520/bluewords.git
cd bluewords
```

**2. Install dependencies**

```bash
npm install
```

**3. Start the development server**

```bash
npm run dev
```

**4. Open the application**

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 📁 Project Structure

```text
src/
├── app/
│   ├── page.tsx
│   ├── vocabulary/
│   │   └── page.tsx
│   └── layout.tsx
├── components/
│   ├── dashboard/
│   ├── layout/
│   ├── ui/
│   └── vocabulary/
├── config/
├── contexts/
├── data/
├── hooks/
└── lib/
```

### 💾 Data Persistence

BlueWords uses the browser's `localStorage` to save vocabulary data.

- Words remain available after refreshing the page.
- No account or login is required.
- Data is stored locally in each browser.
- Vocabulary does not automatically sync across devices or browsers.

### 🧭 Future Improvements

- [ ] Vocabulary review and practice mode
- [ ] Spaced repetition system
- [ ] Custom vocabulary categories
- [ ] Import and export vocabulary
- [ ] Cloud synchronization and user authentication

### 🌐 Deployment

BlueWords is deployed on **Vercel**.

Live application: https://bluewords.vercel.app

### 👨‍💻 Author

Developed by [itcoding2520](https://github.com/itcoding2520).

---

Built with 💙 to make vocabulary learning simple and enjoyable.