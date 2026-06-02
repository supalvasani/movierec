import React from 'react'

const MovieCard = ({movie : {title,vote_average, poster_path, poster_url, release_date,original_language}}) => {
    const resolvedPoster = poster_url || (poster_path ? `https://image.tmdb.org/t/p/w500/${poster_path}` : 'No-Poster.png');
    return (
       <div className="movie-card">
           <img src={resolvedPoster} alt={title}/>
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
