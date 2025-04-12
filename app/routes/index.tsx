import * as fs from 'node:fs'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import * as React from 'react'
import YouTube from 'react-youtube'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { Slider } from '@/components/ui/slider'
import type { YouTubePlayer } from 'react-youtube'
import { Button } from '@/components/ui/button'
import { SpeedInput } from '@/components/ui/speed-input'
import { SectionsTable, Section } from "@/components/sections-table"
import { nanoid } from 'nanoid'
import { PanelRightClose, PanelRightOpen, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Kbd } from '@/components/ui/kbd'

const filePath = 'count.txt'

async function readCount() {
  return parseInt(
    await fs.promises.readFile(filePath, 'utf-8').catch(() => '0'),
  )
}

const getCount = createServerFn({ method: 'GET' }).handler(() => {
  return readCount()
})

const updateCount = createServerFn({ method: 'POST' })
  .validator((addBy: number) => addBy)
  .handler(async ({ data }) => {
    const count = await readCount()
    await fs.promises.writeFile(filePath, `${count + data}`)
  })

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const router = useRouter()

  const [youtubeUrl, setYoutubeUrl] = React.useState('')
  const [playbackRate, setPlaybackRate] = React.useState(1)
  const [player, setPlayer] = React.useState<YouTubePlayer | null>(null)
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'; // Default for SSR
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Initialize sections potentially from URL params
  const [sections, setSections] = React.useState<Section[]>([])
  const [activeLoopSectionId, setActiveLoopSectionId] = React.useState<string | null>(null)
  const loopIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const [isControlsVisible, setIsControlsVisible] = useState(true)
  const [tempStartTime, setTempStartTime] = useState<number | null>(null)
  const [isUrlCopied, setIsUrlCopied] = useState(false)
  const controlsPanelWidth = '30%'

  // Effect to apply the theme class to HTML element
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const presetSpeeds = [0.5, 0.75, 1.0]

  // Basic regex to extract video ID from various YouTube URL formats
  const videoId = React.useMemo(() => {
    const url = youtubeUrl.trim()
    if (!url) return ''
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    )
    return match ? match[1] : ''
  }, [youtubeUrl])

  const opts = {
    width: '100%',
    height: '100%',
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 0,
    },
  }

  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    setPlayer(event.target)
    event.target.setPlaybackRate(playbackRate)
  }

  // --- Speed Handlers ---
  const updatePlaybackRate = (newRate: number) => {
    const clampedRate = Math.max(0.25, Math.min(2, newRate))
    const finalRate = parseFloat(clampedRate.toFixed(2))
    setPlaybackRate(finalRate)
    player?.setPlaybackRate(finalRate)
  }

  const handleSliderChange = (value: number[]) => {
    updatePlaybackRate(value[0])
  }

  // --- Sections Table Handlers ---
  const addSection = (startTime: number | null = null, endTime: number | null = null) => {
    setSections((prev) => [
      ...prev,
      { id: nanoid(), name: "", startTime, endTime },
    ])
  }

  const deleteSection = (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId))
    if (activeLoopSectionId === sectionId) {
      setActiveLoopSectionId(null) // Deactivate if deleting active loop
    }
  }

  const updateSectionName = (sectionId: string, newName: string) => {
    setSections(prev =>
      prev.map(s => (s.id === sectionId ? { ...s, name: newName } : s))
    )
  }

  const updateSectionTime = (
    sectionId: string,
    field: "startTime" | "endTime",
    value: number | null
  ) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, [field]: value } : s))
    )
  }

  const playSection = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId)
    if (player && section && section.startTime !== null) {
      player.seekTo(section.startTime, true)
      setActiveLoopSectionId(sectionId)
      player.playVideo()
    } else if (player && section && section.startTime === null) {
      setActiveLoopSectionId(sectionId)
    }
  }

  // --- Position Handlers (Now independent of specific loop state) ---
  const seekBackward = () => {
    if (!player) return
    const currentTime = player.getCurrentTime()
    player.seekTo(Math.max(0, currentTime - 5), true)
  }

  const seekForward = () => {
    if (!player) return
    const currentTime = player.getCurrentTime()
    player.seekTo(currentTime + 5, true)
  }

  // --- Effect for Active Loop Logic ---
  React.useEffect(() => {
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current)
      loopIntervalRef.current = null
    }

    const activeSection = sections.find(s => s.id === activeLoopSectionId)

    if (activeSection && player && activeSection.startTime !== null && activeSection.endTime !== null && activeSection.endTime > activeSection.startTime) {
      loopIntervalRef.current = setInterval(() => {
        const currentActiveSection = sections.find(s => s.id === activeLoopSectionId)
        if (currentActiveSection && player.getPlayerState() === 1 && currentActiveSection.startTime !== null && currentActiveSection.endTime !== null) {
          const currentTime = player.getCurrentTime()
          if (currentTime >= currentActiveSection.endTime) {
            player.seekTo(currentActiveSection.startTime, true)
          }
        }
      }, 250)
    }

    return () => {
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current)
        loopIntervalRef.current = null
      }
    }
  }, [activeLoopSectionId, sections, player]) // Rerun when active loop or sections change

  // --- Effect to Load State from URL ---
  React.useEffect(() => {
    // Use URLSearchParams to safely get parameters
    const searchParams = new URLSearchParams(router.state.location.searchStr);
    const videoParam = searchParams.get('v');
    const sectionsParam = searchParams.get('s');

    let loadedFromUrl = false; // Flag to track if we loaded anything

    // Load video from 'v' parameter
    if (videoParam) {
      console.log("Loading video from URL param: ", videoParam);
      setYoutubeUrl(`https://www.youtube.com/watch?v=${videoParam}`);
      loadedFromUrl = true;
    }

    // Load sections from 's' parameter
    if (sectionsParam) {
      console.log("Loading sections from URL param...");
      try {
        const decodedJson = atob(sectionsParam); // Decode Base64
        const parsedSections = JSON.parse(decodedJson); // Parse JSON

        // Basic validation: check if it's an array
        if (Array.isArray(parsedSections)) {
          // Further validation could check section structure
          console.log("Successfully parsed sections:", parsedSections);
          setSections(parsedSections);
          loadedFromUrl = true;
        } else {
          console.error("Parsed sections data is not an array:", parsedSections);
          // Don't set defaults here yet, wait till the end
        }
      } catch (error) {
        console.error("Failed to decode/parse sections from URL:", error);
        // Don't set defaults here yet, wait till the end
      }
    }

    // Only set default sections if NOTHING was loaded from the URL
    if (!loadedFromUrl) {
      setDefaultSections();
    }

  }, [router.state.location.searchStr]); // Use searchStr in dependency array

  // Helper to set default sections if URL loading fails or no params given
  const setDefaultSections = () => {
      console.log("Setting default sections.")
      setSections([
        { id: nanoid(), name: "Solo 1", startTime: 164, endTime: 237 },
        { id: nanoid(), name: "Run 1", startTime: 241, endTime: 261 },
        { id: nanoid(), name: "Run 2", startTime: 262, endTime: 269.3 },
      ]);
      // Also set default video if none loaded from URL
      if (!youtubeUrl) {
          setYoutubeUrl('https://www.youtube.com/watch?v=DYHng61lftA');
      }
  };

  // --- Effect for Keyboard Shortcuts ---
  useEffect(() => {
    // Map QWERTY keys to section indices (0-9)
    const keyToSectionIndexMap: { [key: string]: number } = {
        Q: 0, W: 1, E: 2, R: 3, T: 4,
        Y: 5, U: 6, I: 7, O: 8, P: 9,
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if modifier keys are pressed
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }

      // Ignore if typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = parseInt(event.key, 10);
      const upperKey = event.key.toUpperCase(); // Use uppercase for mapping
      const lowerKey = event.key.toLowerCase(); // Use lowercase for mapping

      if (!isNaN(key) && key >= 1 && key <= 9) {
        const sectionIndex = key - 1;
        if (sectionIndex < sections.length) {
          const targetSection = sections[sectionIndex];
          if (player && targetSection.startTime !== null) {
            console.log(`Seeking to start of Section ${key} (${targetSection.name}) at ${targetSection.startTime} and activating loop.`);
            player.seekTo(targetSection.startTime, true);
            setActiveLoopSectionId(targetSection.id);
            player.playVideo();
          }
        }
      }
       else if (event.key === ' ') {
         event.preventDefault(); // Prevent page scroll
         if (player) {
           const state = player.getPlayerState();
           if (state === 1) { // Playing
             player.pauseVideo();
           } else { // Paused, ended, cued, etc.
             player.playVideo();
           }
         }
       }
       // --- New Shortcut Logic for '[' ---
       else if (event.key === '[') {
           event.preventDefault(); // Prevent typing bracket if not in input
           if (!player) return;

           const currentTime = parseFloat(player.getCurrentTime().toFixed(2));

           if (tempStartTime === null) {
               // First press: Record start time
               setTempStartTime(currentTime);
               console.log(`Section Start marked at: ${formatTime(currentTime)}`);
               // TODO: Add visual feedback?
           } else {
               // Second press: Record end time and create section
               const endTime = currentTime;
               if (endTime > tempStartTime) {
                   console.log(`Section End marked at: ${formatTime(endTime)}, creating section.`);
                   addSection(tempStartTime, endTime); // Create section with times
               } else {
                   console.log("End time must be after start time. Resetting mark.");
               }
               setTempStartTime(null); // Reset marker
           }
       }
       // --- New Shortcut Logic for QWERTYUIOP (seek end) ---
       else if (upperKey in keyToSectionIndexMap) {
           event.preventDefault();
           const sectionIndex = keyToSectionIndexMap[upperKey];

           if (sectionIndex < sections.length) {
               const targetSection = sections[sectionIndex];
               if (player && targetSection.endTime !== null) {
                   console.log(`Seeking to end of Section ${sectionIndex + 1} (${targetSection.name}) at ${formatTime(targetSection.endTime)} and deactivating loop.`);
                   player.seekTo(targetSection.endTime, true);
                   setActiveLoopSectionId(null); // Deactivate loop
               }
           }
       }
       // --- New Shortcut Logic for Speed Control ---
       else if (event.key === '-') {
           event.preventDefault();
           updatePlaybackRate(playbackRate - 0.05);
       }
       else if (event.key === '=') { // Usually shares key with +
           event.preventDefault();
           updatePlaybackRate(playbackRate + 0.05);
       }
       // --- New Shortcut Logic for 0 key (seek to start) ---
       else if (event.key === '0') {
            event.preventDefault();
            if (player) {
                console.log("Seeking to video start (0:00).");
                player.seekTo(0, true);
                // Also play if paused
                if (player.getPlayerState() !== 1) { // 1 === PLAYING
                    player.playVideo();
                }
            }
       }
       // --- Shortcut for toggling Controls Visibility ---
       else if (lowerKey === 'b') {
            event.preventDefault();
            setIsControlsVisible(prev => !prev);
       }
       // --- Shortcut for toggling Theme ---
       else if (lowerKey === 'm') {
            event.preventDefault();
            toggleTheme();
       }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [player, sections, setActiveLoopSectionId, tempStartTime, setTempStartTime, playbackRate, setIsControlsVisible, toggleTheme]);

  // --- Copy URL Logic ---
  const handleCopyUrl = () => {
    if (!videoId) return; // Don't copy if no video

    try {
      const sectionsJson = JSON.stringify(sections);
      const encodedSections = btoa(sectionsJson); // Base64 encode
      const shareUrl = `${window.location.origin}${window.location.pathname}?v=${videoId}&s=${encodedSections}`;

      navigator.clipboard.writeText(shareUrl).then(() => {
        setIsUrlCopied(true);
        setTimeout(() => setIsUrlCopied(false), 2000); // Reset feedback after 2 seconds
      }).catch(err => {
        console.error("Failed to copy URL: ", err);
        // Optionally show an error message to the user
      });
    } catch (error) {
      console.error("Error generating share URL:", error);
      // Handle potential errors during stringify/btoa
    }
  };

  return (
    <div className="relative flex h-screen w-screen bg-background text-foreground">
      <div className="flex-grow p-4 flex justify-center items-center">
        <div className="relative w-full aspect-video max-w-full">
          {videoId ? (
            <YouTube
              videoId={videoId}
              opts={opts}
              iframeClassName="absolute top-0 left-0 w-full h-full"
              className=""
              onReady={onPlayerReady}
            />
          ) : (
            <div className="absolute top-0 left-0 w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 rounded">
              {youtubeUrl === '' ? 'Loading from URL or enter a YouTube URL...' : 'Enter a valid YouTube URL to play a video'}
            </div>
          )}
        </div>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsControlsVisible(!isControlsVisible)}
                className="absolute top-2 h-7 w-7 z-20 transition-[right] duration-300 ease-in-out"
                style={{
                  right: isControlsVisible ? `calc(${controlsPanelWidth} + 0.5rem)` : '0.5rem'
                }}
              >
                {isControlsVisible ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </Button>
          </TooltipTrigger>
          <TooltipContent>
             <p>{isControlsVisible ? "Hide Controls" : "Show Controls"} <Kbd className="ml-1">B</Kbd></p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="absolute bottom-2 h-7 w-7 z-20 transition-[right] duration-300 ease-in-out"
              style={{
                right: isControlsVisible ? `calc(${controlsPanelWidth} + 0.5rem)` : '0.5rem'
              }}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode <Kbd className="ml-1">M</Kbd></p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div
        className={cn(
            "flex flex-col justify-start pt-8 space-y-4 overflow-y-auto transition-[width,padding] duration-300 ease-in-out border-l border-border",
            isControlsVisible ? "w-3/10 p-4" : "w-0 p-0 border-l-0"
        )}
        style={{ width: isControlsVisible ? controlsPanelWidth : '0' }}
      >
        <div className={cn("flex flex-col space-y-8", !isControlsVisible && "hidden")}>
          <div className="space-y-1 flex-shrink-0">
            <Label htmlFor="youtube-url" className="text-xs font-normal text-muted-foreground">YouTube URL</Label>
            <Input
              id="youtube-url"
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full h-8"
              style={{ boxShadow: 'none' }}
            />
          </div>

          <div className="space-y-1 flex-shrink-0">
            <Label htmlFor="playback-speed-slider" className="text-xs font-normal text-muted-foreground">Playback Speed</Label>
            <div className="flex items-center space-x-1">
              <Slider
                id="playback-speed-slider"
                min={0.25}
                max={2}
                step={0.01}
                value={[playbackRate]}
                onValueChange={handleSliderChange}
                disabled={!player}
                className="flex-grow"
              />
              <SpeedInput
                min={0.25}
                max={2}
                step={0.05}
                value={playbackRate}
                onChange={updatePlaybackRate}
                disabled={!player}
                className="h-8"
              />
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {presetSpeeds.map((speed) => (
                <Button
                  key={speed}
                  variant={"outline"}
                  size="sm"
                  onClick={() => updatePlaybackRate(speed)}
                  disabled={!player}
                  className={cn("flex-1 font-normal w-12", {
                    "bg-primary dark:bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground dark:text-background hover:dark:bg-primary": playbackRate === speed
                  })}
                  style={{ boxShadow: 'none' }}
                >
                  {speed.toFixed(speed === 1.0 ? 1 : 2)}x
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-normal text-muted-foreground">Loop Sections</h2>
            <SectionsTable
               sections={sections}
               activeLoopSectionId={activeLoopSectionId}
               setActiveLoopSectionId={setActiveLoopSectionId}
               updateSectionName={updateSectionName}
               updateSectionTime={updateSectionTime}
               deleteSection={deleteSection}
               addSection={addSection}
               playSection={playSection}
            />
            <Button
              onClick={handleCopyUrl}
              disabled={!videoId || sections.length === 0}
              className="w-full mt-4"
              variant="outline"
              size="sm"
              style={{ boxShadow: 'none' }}
            >
              {isUrlCopied ? 'Copied!' : 'Copy Shareable URL'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function (ensure it's defined or imported)
function formatTime(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds) || totalSeconds < 0) {
    return '--:--'; // Display for placeholder/invalid
  }
  totalSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
