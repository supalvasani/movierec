import React, {useState} from 'react'
import Search from "./Components/Search.jsx";

const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    return (
        <main>
        <div className= "pattern" />
        <div className= "wrapper">
            <header>
                <img src="./hero.png" alt={"Hero Banner"}/>
                <h1>Find <span className="text-gradient">Movies</span>You'll Enjoy Without Hassle!!</h1>
            </header>

            <Search searchTerm = {searchTerm} setSearchTerm={setSearchTerm} />
        </div>
        </main>
    )
}
export default App
