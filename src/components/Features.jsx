const features=[
["Easy Checkout","Fast intuitive sales processing"],
["Inventory Tracking","Monitor stock levels"],
["Detailed Reports","Insights on sales and trends"]
]

export default function Features(){
 return(
<section className="grid md:grid-cols-3 gap-6 px-12 pb-20">

{features.map((f,i)=>(
<div
key={i}
className="p-8 rounded-xl shadow hover:shadow-lg transition bg-white">

<h3 className="text-lg font-semibold text-green-700">
{f[0]}
</h3>

<p className="mt-2 text-gray-600">
{f[1]}
</p>

</div>
))}

</section>
 )
}
