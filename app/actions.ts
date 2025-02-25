// 'use server';

// import { streamUI } from 'ai/rsc';
// import { createOpenAI as createGroq } from '@ai-sdk/openai';
// import { z } from 'zod';

// const groq = createGroq({
//   baseURL: 'https://api.groq.com/openai/v1',
//   apiKey: process.env.GROQ_API_KEY,
// });

// export async function streamComponent() {
//   const result = await streamUI({
//     model: groq('llama-3.1-70b-versatile'),
//     prompt: 'Get the weather for San Francisco',
//     text: ({ content }) => <div>{content}</div>,
//     tools: {
//       getWeather: {
//         description: 'Get the weather for a location',
//         parameters: z.object({ location: z.string() }),
//         generate: async function* ({ location }) {
//           yield <div>loading...</div>;
//           const weather = '25c'; // await getWeather(location);
//           return (: any
//             <div any>
//               the weather in {location} is {weather}.
//             </div>
//           );
//         },
//       },
//     },
//   });
//   return result.value;
// }