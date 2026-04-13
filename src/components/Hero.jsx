import {motion} from "framer-motion"

export default function Hero(){
 return(
<section className="flex items-center justify-between px-12 py-20">

<div className="max-w-xl">

<motion.h1
initial={{opacity:0,y:40}}
animate={{opacity:1,y:0}}
transition={{duration:.7}}
className="text-5xl font-bold leading-tight">

Streamline Your Business  
<span className="text-green-700"> with Posifine</span>

</motion.h1>

<p className="mt-6 text-lg text-gray-600">
Powerful POS platform to manage sales, inventory and payments seamlessly.
</p>

<button className="mt-8 bg-green-600 text-white px-8 py-3 rounded-lg shadow hover:scale-105 transition">
Get Started
</button>

</div>

<img
src="/hero-pos.png"
className="w-[550px] drop-shadow-xl"
/>

</section>
 )
}
