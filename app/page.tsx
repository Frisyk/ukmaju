import { ChatDemo } from "@/components/chat-demo";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center max-w-2xl mx-auto">
      <div className="">
        <ChatDemo />
      </div>
    </main>
  );
}
// 'use client';

// import { useState } from 'react';
// import { streamComponent } from './actions';

// export default function Page() {
//   const [component, setComponent] = useState<React.ReactNode>();

//   return (
//     <div>
//       <form
//         onSubmit={async e => {
//           e.preventDefault();
//           setComponent(await streamComponent());
//         }}
//       >
//         <button>Stream Component</button>
//       </form>
//       <div>{component}</div>
//     </div>
//   );
// }