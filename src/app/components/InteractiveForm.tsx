"use client";

import axios, { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {  BsCopy } from "react-icons/bs";
import { Button } from "./Button";
import PromptForm from "./PromptForm";
import Dropdown from "./Dropdown";
import tweetCategories, { TweetCategory } from "../lib/data";

const BASE_URL: string =
  process.env.NODE_ENV == "production"
    ? "https://twitter-post-genai.vercel.app"
    : "http://localhost:3000";

const InteractiveForm = () => {
  const [description, setDescription] = useState<string>("");
  const [tweetIdeas, setTweetIdeas] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string,string>>(
    tweetCategories.reduce((acc, category) => ({...acc, [category.key]: ''}), {}));

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    fetchTweetIdeas();
  };

  const fetchTweetIdeas = async () => {
    try {
      const response = await axios.post(
        BASE_URL + "/api/submit",
        JSON.stringify({ description,selectedOptions }),
        { withCredentials: true }
      );

      if (response.status !== 200) {
        throw new Error("Failed to fetch tweet ideas");
      }

      const data = await response.data;
      console.log(data);

      const tweets = data.tweet;

      toast(" Generated successfully!", {
        icon: "👏",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      setTweetIdeas(tweets);
    } catch (error: unknown) {
      console.error("Error fetching tweet ideas:", error);

      if (isAxiosError(error)) {
        if (error.response?.status == 429) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else toast.error("Failed to generate tweet ideas. Please try again.");
      }
    } finally {
      setLoading(false);
      setDescription("");
      setSelectedOptions(tweetCategories.reduce((acc, category) => ({...acc, [category.key]: ''}), {}));
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full max-w-2xl bg-inherit relative px-2">
      <PromptForm handleSubmit={handleSubmit} description={description} loading={loading} setDescription={setDescription}/>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 mb-6">
        {tweetCategories.map((category : TweetCategory) => (
          <Dropdown
          key={category.key}
          label={category.name}
          options={category.options}
          selectedOption={selectedOptions[category.key]}
          setSelectedOption={(value) =>
            setSelectedOptions((prev) => ({ ...prev, [category.key]: value || '' }))
          }
          />
        ))}
      </div>

      {loading && (
        <div className="absolute -bottom-8 left-0 right-0 bg-gray-950 bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-300"></div>
        </div>
      )}

      {/* { tweetIdeas.length > 0  && 
        <Button onClick={()=>  toast.promise(fetchTweetIdeas(), {
            loading: "Regenerating...",
            success: <b> Regenerated successfully!</b>,
            error: <b> Could not regenerate.</b>
          })} className="border border-white rounded-md p-2 flex gap-2 items-center text-sm font-medium hover:bg-white hover:text-black duration-500 transition-all ease-in">
          Regenrate <GrPowerCycle size={15} />
        </Button>
      } */}

      {tweetIdeas.length > 0 && tweetIdeas.map((tweet,idx) => (
        <div key={idx} >
        <div className="relative border-2 border-gray-900 bg-transparent mt-2 p-2 rounded-lg  h-auto overflow-y-auto">
          <div className="w-full p-2 pr-24 max-w-2xl bg-inherit">
            <div className="w-full flex flex-col justify-center items-center text-wrap text-base text-gray-100">
              {tweet}
            </div>
          </div>

          <Button
            onClick={() => {
              navigator.clipboard.writeText(tweet);
              toast("Copied to clipboard", {
                icon: "📋",
                style: {
                  borderRadius: "10px",
                  background: "#333",
                  color: "#fff",
                },
              });
            }}
            className="text-[12px] flex items-center gap-1 bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 absolute right-1 top-1"
            >
            <BsCopy size={15} /> Copy
          </Button>
          <Toaster position="top-center" reverseOrder={false} />
        </div>
      </div>
      )) }
    </div>
  );
};

export default InteractiveForm;
