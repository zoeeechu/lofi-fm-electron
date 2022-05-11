import { useEffect, useState } from "react";
import axios from "axios";
import "./all-songs-style.css";
import { ReactComponent as CloseIcon } from "../../icons/close-icon.svg";
import Songs from "./Songs";
import { useRecoilState, useSetRecoilState } from "recoil";
import { SongsState } from "../../recoil/atoms/SongsState";
import { defaultSongs } from "../../constants/songs";
import { PlayerState } from "../../recoil/atoms/PlayerState";
import { getAddedSongs, getAllSongs } from "../../utils/songs";

export type AllSongsProps = {
  onSongClick(songId: string): void;
  activeSongId?: string;
  onClose?(): void;
};

function AllSongs({ onSongClick, activeSongId, onClose }: AllSongsProps) {
  const [songsData, setSongsData] = useRecoilState(SongsState);
  const [activeOption, setActiveOption] = useState<
    "allsongs" | "starred" | "addsong"
  >("allsongs");
  const [url, setUrl] = useState("");

  const getSongsData = async (id: string) => {
    const response = await axios.get(
      `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&key=${
        import.meta.env.VITE_YT_KEY
      }&id=${id}`
    );
    return response.data.items.map((item: any) => ({
      ...item.snippet,
      id: item.id,
    }));
  };

  useEffect(() => {
    const fetchSongs = async () => {
      const songsIds = getAllSongs();
      const songsArr = await getSongsData(songsIds.join(","));
      setSongsData((prev) => ({ ...prev, songs: songsArr, isLoading: false }));
    };
    fetchSongs();
  }, []);

  const handleAddorRemoveStar = (songId: string, isAdding: boolean) => {
    let newStarred: string[] = [];
    setSongsData((prev) => {
      if (isAdding) {
        newStarred = [...prev.starredIds, songId];
      } else {
        newStarred = prev.starredIds.filter((sid: string) => sid !== songId);
      }
      return { ...prev, starredIds: newStarred };
    });
    window.localStorage.setItem("starred", JSON.stringify(newStarred));
  };

  const handleAddClick = async () => {
    try {
      const urlObj = new URL(url);
      let id = urlObj.searchParams.get("v");
      if (!id) {
        id = urlObj.pathname?.substring(1);
      }

      const res = (await getSongsData(id)) as any[];

      setSongsData((prev: any) => ({
        ...prev,
        songs: [...res, ...prev.songs],
      }));

      const existingAddedSongs = getAddedSongs();
      window.localStorage.setItem(
        "addedSongs",
        JSON.stringify([id, ...existingAddedSongs])
      );
      setActiveOption("allsongs");
    } catch {
      alert("invalid youtube url");
    }
  };

  if (songsData.isLoading) {
    return (
      <div className="all-songs-container">
        <div className="header">
          <div className="options">
            <button className={`${activeOption === "starred" ? "active" : ""}`}>
              Starred
            </button>
            <button
              className={`${activeOption === "allsongs" ? "active" : ""}`}
            >
              All Songs
            </button>
            <button className={`${activeOption === "addsong" ? "active" : ""}`}>
              Add Song
            </button>
          </div>
          <div className="close">
            <button onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
        </div>
        <div style={{ padding: "15px" }}>Loading..</div>
      </div>
    );
  }

  return (
    <div className="all-songs-container">
      <div className="header">
        <div className="options">
          <button
            onClick={() => setActiveOption("starred")}
            className={`${activeOption === "starred" ? "active" : ""}`}
          >
            Starred
          </button>
          <button
            onClick={() => setActiveOption("allsongs")}
            className={`${activeOption === "allsongs" ? "active" : ""}`}
          >
            All Songs
          </button>
          <button
            onClick={() => setActiveOption("addsong")}
            className={`${activeOption === "addsong" ? "active" : ""}`}
          >
            Add Song
          </button>
        </div>
        <div className="close">
          <button onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
      </div>
      {activeOption === "allsongs" && (
        <Songs
          songs={songsData.songs}
          onSongClick={onSongClick}
          activeSongId={activeSongId}
          addOrRemoveStar={handleAddorRemoveStar}
          starred={songsData.starredIds}
        />
      )}

      {activeOption === "starred" && (
        <Songs
          songs={songsData.songs.filter((song: any) =>
            songsData.starredIds.includes(song.id)
          )}
          onSongClick={onSongClick}
          activeSongId={activeSongId}
          addOrRemoveStar={handleAddorRemoveStar}
          starred={songsData.starredIds}
        />
      )}

      {activeOption === "addsong" && (
        <div className="add-song">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="paste youtube url here.."
          />
          <button onClick={handleAddClick}>Add</button>
        </div>
      )}
    </div>
  );
}

export default AllSongs;