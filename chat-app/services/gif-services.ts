import { useState } from "react";
import axios from "axios";
//Gif key
const TENOR_API_KEY = "LIVDSRZULELA"; // temp key
const TENOR_LIMIT = 5;

export function useGIFs() {
  const [gifResults, setGifResults] = useState<any[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);
  const fetchTrendingGIFs = async () => {
    try {
      setLoadingGifs(true);
      const res = await axios.get(
        `https://g.tenor.com/v1/trending?key=${TENOR_API_KEY}&limit=${TENOR_LIMIT}`,
      );

      console.log("TRENDING GIFS:", res.data.results);
      setGifResults(res.data.results);
    } catch (error) {
      console.log("Tenor error:", error);
    } finally {
      setLoadingGifs(false);
    }
  };

  const fetchGifQuery = async (query: string) => {
    try {
      setLoadingGifs(true);
      const res = await axios.get(
        `https://g.tenor.com/v1/search?key=${TENOR_API_KEY}&limit=${TENOR_LIMIT}&q=${query}`,
      );

      console.log("TRENDING GIFS:", res.data.results);
      setGifResults(res.data.results);
    } catch (error) {
      console.log("Tenor error:", error);
    } finally {
      setLoadingGifs(false);
    }
  };
  return { gifResults, loadingGifs, fetchTrendingGIFs, fetchGifQuery };
}
