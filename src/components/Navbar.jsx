import {useNavigate} from "react-router-dom"

export default function Navbar(){
 const navigate = useNavigate();
 return(
  <header className="flex justify-between items-center px-12 py-6 shadow-sm">

    <h1 className="text-2xl font-bold text-green-700">
      Posifine
    </h1>

    <nav className="hidden md:flex gap-10 font-medium">
      <a className="hover:text-green-700">Home</a>
      <a>Features</a>
      <a>Gallery</a>
      <a>Contact</a>
    </nav>

    <div className="flex gap-3">
      <button onClick={() => navigate('/auth/login')} className="px-5 py-2 border rounded-lg">
        Login
      </button>

      <button onClick={() => navigate('/choose-subscription')} className="px-5 py-2 bg-green-600 text-white rounded-lg">
        Get Started
      </button>
    </div>

  </header>
 )
}
