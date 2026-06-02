import React from 'react'

const FALLBACK_POSTER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%230f0d23'/%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' fill='%23cecefb' font-size='18' font-family='sans-serif'%3ENo Poster%3C/text%3E%3Ctext x='50%25' y='58%25' dominant-baseline='middle' text-anchor='middle' fill='%23a8b5db' font-size='40'%3E%F0%9F%8E%AC%3C/text%3E%3C/svg%3E";

const MovieCard = ({movie, onClick}) => {
    const {title,vote_average, poster_path, poster_url, release_date,original_language} = movie;
    const resolvedPoster = poster_url || poster_path || FALLBACK_POSTER;
    return (
       <div className="movie-card cursor-pointer hover:scale-105 transition-transform" onClick={() => onClick(movie)}>
           <img src={resolvedPoster} alt={title} onError={(e) => { e.target.src = FALLBACK_POSTER; }} />
           <div className="mt-4"><h3>{title}</h3></div>
           <div className="content">
               <div className= "rating">
                    <img src= "star.svg" alt="Star Icon"/>
                   <p>{vote_average ? vote_average.toFixed() : 'N/A'}</p>
               </div>

               <span>•</span>
               <p className="lang">{original_language}</p>

               <span>•</span>
               <p className="year">{release_date ? release_date.split('-')[0] : 'N/A'}</p>
           </div>
       </div>
    )
}
export default MovieCard
