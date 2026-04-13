import {useEffect,useState} from "react"
import axios from "axios"

export default function Gallery(){

 const [images,setImages]=useState([])

 useEffect(()=>{
  axios.get("/api/public/images")
  .then(res=>setImages(res.data))
  .catch(()=>setImages([
   "/demo1.jpg",
   "/demo2.jpg",
   "/demo3.jpg"
  ]))
 },[])

 return(
<section className="px-12 pb-24">

<h2 className="text-3xl font-bold text-center mb-10">
POS Gallery
</h2>

<div className="grid md:grid-cols-3 gap-6">

{images.map((img,i)=>(
<img
key={i}
src={img}
className="rounded-xl shadow hover:scale-105 transition duration-300"
/>
))}

</div>

</section>
 )
}
