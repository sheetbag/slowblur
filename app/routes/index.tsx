import { createFileRoute, useRouter } from '@tanstack/react-router'
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
import { PanelRightClose, PanelRightOpen, Moon, Sun, Space } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Kbd } from '@/components/ui/kbd'
import { toast } from 'sonner'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const router = useRouter()
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [youtubeUrl, setYoutubeUrl] = React.useState('')
  const [playbackRate, setPlaybackRate] = React.useState(1)
  const [player, setPlayer] = React.useState<YouTubePlayer | null>(null)
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [sections, setSections] = React.useState<Section[]>([])
  const [activeLoopSectionId, setActiveLoopSectionId] = React.useState<string | null>(null)
  const loopIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const [isControlsVisible, setIsControlsVisible] = useState(true)
  const [tempStartTime, setTempStartTime] = useState<number | null>(null)
  const [isUrlCopied, setIsUrlCopied] = useState(false)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [isMirrored, setIsMirrored] = React.useState(false)

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

  const seekToStart = () => {
    if (!player) return;
    player.seekTo(0, true);
  }

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

  const toggleMirror = () => {
    setIsMirrored(prev => !prev);
  };

  const presetSpeeds = [0.5, 0.75, 1.0]

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
      autoplay: 0,
    },
  }

  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    setPlayer(event.target)
    event.target.setPlaybackRate(playbackRate)
  }

  const onPlayerStateChange = (event: { data: number }) => {
    setIsPlaying(event.data === 1)
  }

  const updatePlaybackRate = (newRate: number) => {
    const clampedRate = Math.max(0.25, Math.min(2, newRate))
    const finalRate = parseFloat(clampedRate.toFixed(2))
    setPlaybackRate(finalRate)
    player?.setPlaybackRate(finalRate)
  }

  const handleSliderChange = (value: number[]) => {
    updatePlaybackRate(value[0])
  }

  const addSection = (startTime: number | null = null, endTime: number | null = null) => {
    setSections((prev) => [
      ...prev,
      { id: nanoid(), name: "", startTime, endTime },
    ])
  }

  const deleteSection = (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId))
    if (activeLoopSectionId === sectionId) {
      setActiveLoopSectionId(null)
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
  }, [activeLoopSectionId, sections, player])

  React.useEffect(() => {
    const searchParams = new URLSearchParams(router.state.location.searchStr);
    const videoParam = searchParams.get('v');
    const sectionsParam = searchParams.get('s');

    let loadedFromUrl = false;

    if (videoParam) {
      setYoutubeUrl(`https://www.youtube.com/watch?v=${videoParam}`);
      loadedFromUrl = true;
    }

    if (sectionsParam) {
      try {
        const decodedJson = atob(sectionsParam);
        const parsedSections = JSON.parse(decodedJson);

        if (Array.isArray(parsedSections)) {
          setSections(parsedSections);
          loadedFromUrl = true;
        } else {
          console.error("Parsed sections data is not an array:", parsedSections);
        }
      } catch (error) {
        console.error("Failed to decode/parse sections from URL:", error);
      }
    }

    if (!loadedFromUrl) {
      setDefaultSections();
    }
  }, [router.state.location.searchStr]);

  const setDefaultSections = () => {
      setSections([
        { id: nanoid(), name: "Run 1", startTime: 241, endTime: 261 },
        { id: nanoid(), name: "Run 2", startTime: 262, endTime: 269.3 },
      ]);
      if (!youtubeUrl) {
          setYoutubeUrl('https://www.youtube.com/watch?v=DYHng61lftA');
      }
  };

  useEffect(() => {
    const keyToSectionIndexMap: { [key: string]: number } = {
        Q: 0, W: 1, E: 2, R: 3, T: 4,
        Y: 5, U: 6, I: 7, O: 8, P: 9,
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }

      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = parseInt(event.key, 10);
      const upperKey = event.key.toUpperCase();
      const lowerKey = event.key.toLowerCase();

      if (!isNaN(key) && key >= 1 && key <= 9) {
        const sectionIndex = key - 1;
        if (sectionIndex < sections.length) {
          const targetSection = sections[sectionIndex];
          if (player && targetSection.startTime !== null) {
            player.seekTo(targetSection.startTime, true);
            setActiveLoopSectionId(targetSection.id);
            player.playVideo();
          }
        }
      }
       else if (event.key === ' ') {
         event.preventDefault();
         if (player) {
           const state = player.getPlayerState();
           if (state === 1) {
             player.pauseVideo();
           } else {
             player.playVideo();
           }
         }
       }
       else if (event.key === '[') {
           event.preventDefault();
           if (!player) return;

           const currentTime = parseFloat(player.getCurrentTime().toFixed(2));
           const formattedTime = formatTime(currentTime);

           if (tempStartTime === null) {
               setTempStartTime(currentTime);
               toast("Recorded section start time", {
                   description: `Time: ${formattedTime}`
               });
           } else {
               const endTime = currentTime;
               const formattedStartTime = formatTime(tempStartTime);
               if (endTime > tempStartTime) {
                   addSection(tempStartTime, endTime);
                   toast("Recorded section end time. Added new section.", {
                       description: `Section: ${formattedStartTime} - ${formattedTime}`
                   });
               } else {
                   toast.error("End time must be after start time", {
                       description: `Start time was ${formattedStartTime}`
                   });
               }
               setTempStartTime(null);
           }
       }
       else if (upperKey in keyToSectionIndexMap) {
           event.preventDefault();
           const sectionIndex = keyToSectionIndexMap[upperKey];

           if (sectionIndex < sections.length) {
               const targetSection = sections[sectionIndex];
               if (player && targetSection.endTime !== null) {
                   player.seekTo(targetSection.endTime, true);
                   setActiveLoopSectionId(null);
               }
           }
       }
       else if (event.key === '-') {
           event.preventDefault();
           updatePlaybackRate(playbackRate - 0.05);
       }
       else if (event.key === '=') {
           event.preventDefault();
           updatePlaybackRate(playbackRate + 0.05);
       }
       else if (event.key === '0') {
            event.preventDefault();
            if (player) {
                player.seekTo(0, true);
                if (player.getPlayerState() !== 1) {
                    player.playVideo();
                }
            }
       }
       else if (lowerKey === 'b') {
            event.preventDefault();
            setIsControlsVisible(prev => !prev);
       }
       else if (lowerKey === 'm') {
            event.preventDefault();
            toggleTheme();
       }
       else if (event.key === 'ArrowLeft') {
           event.preventDefault();
           seekBackward();
       }
       else if (event.key === 'ArrowRight') {
           event.preventDefault();
           seekForward();
       }
       else if (lowerKey === 'f') {
           event.preventDefault();
           toggleMirror();
       }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [player, sections, setActiveLoopSectionId, tempStartTime, setTempStartTime, playbackRate, setIsControlsVisible, toggleTheme, toggleMirror]);

  React.useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement) return;

    const handleResize = () => {
      const screenWidth = window.innerWidth;

      if (screenWidth >= 640 && screenWidth < 1200) {
        const scale = screenWidth / 1200;
        containerElement.style.transform = `scale(${scale})`;
        containerElement.style.transformOrigin = 'top left';
        containerElement.style.width = '1200px';
        containerElement.style.height = `calc(100vh / ${scale})`;
        document.body.style.overflow = 'hidden';
      } else {
        containerElement.style.transform = '';
        containerElement.style.transformOrigin = '';
        containerElement.style.width = '';
        containerElement.style.height = '';
        document.body.style.overflow = '';
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerElement) {
          containerElement.style.transform = '';
          containerElement.style.transformOrigin = '';
          containerElement.style.width = '';
          containerElement.style.height = '';
      }
      document.body.style.overflow = '';
    };
  }, []);

  const handleCopyUrl = () => {
    if (!videoId) return;

    try {
      const sectionsJson = JSON.stringify(sections);
      const encodedSections = btoa(sectionsJson);
      const shareUrl = `${window.location.origin}${window.location.pathname}?v=${videoId}&s=${encodedSections}`;

      navigator.clipboard.writeText(shareUrl).then(() => {
        setIsUrlCopied(true);
        setTimeout(() => setIsUrlCopied(false), 2000);
      }).catch(err => {
        console.error("Failed to copy URL: ", err);
      });
    } catch (error) {
      console.error("Error generating share URL:", error);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col sm:flex-row h-screen w-screen bg-background text-foreground overflow-hidden"
    >
      {/* Video Area */}
      <div className="w-full sm:flex-grow p-4 flex justify-center items-center relative">
        <div className="relative w-full aspect-video max-w-full">
          {videoId ? (
            <YouTube
              videoId={videoId}
              opts={opts}
              iframeClassName={cn(
                "absolute top-0 left-0 w-full h-full",
                isMirrored && "transform scale-x-[-1]"
              )}
              className=""
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
            />
          ) : (
            <div className="absolute top-0 left-0 w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 rounded">
              {youtubeUrl === '' ? 'Loading from URL or enter a YouTube URL...' : 'Enter a valid YouTube URL to play a video'}
            </div>
          )}
        </div>

        <div className="hidden sm:block">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsControlsVisible(!isControlsVisible)}
                    className={cn(
                      "absolute top-2 right-2 h-7 w-7 z-20 transition-opacity duration-300 ease-in-out"
                    )}
                  >
                    {isControlsVisible ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                  </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isControlsVisible ? "Hide Controls" : "Show Controls"} <Kbd className="ml-1">B</Kbd></p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="hidden sm:block">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className={cn(
                    "absolute bottom-2 right-2 h-7 w-7 z-20 transition-opacity duration-300 ease-in-out"
                  )}
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
        </div>

      </div>

      <div
        className={cn(
            // Base mobile styles (always applied):
            "w-full flex flex-col justify-start space-y-4 overflow-y-auto p-4 border-t sm:border-t-0 sm:border-l border-border",
            // Desktop transition styles (apply sm and up):
            "sm:pt-8 sm:transition-[width,padding] sm:duration-300 sm:ease-in-out",
            // Desktop visibility logic (apply sm and up):
            isControlsVisible
              ? "sm:w-2/5 sm:p-4"
              : "sm:w-0 sm:p-0 sm:border-l-0"
        )}
      >
        <div className="flex flex-col space-y-8">
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
            <div className="flex flex-wrap gap-1">
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
          </div>

          <div className="space-y-1 flex-shrink-0">
            <Label htmlFor="playback-speed-slider" className="text-xs font-normal text-muted-foreground">Playback Controls</Label>
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        style={{ boxShadow: 'none' }}
                        onClick={seekToStart}
                        disabled={!player}
                        className="flex-1 font-normal"
                    >
                        Video Start
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>Seek to Start <Kbd className="ml-1">0</Kbd></p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        style={{ boxShadow: 'none' }}
                        onClick={seekBackward}
                        disabled={!player}
                        className="flex-1 font-normal"
                    >
                        -5 Secs
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>Seek Backward 5s <Kbd className="ml-1">←</Kbd></p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Button
                              variant="outline"
                              size="sm"
                              style={{ boxShadow: 'none' }}
                              onClick={seekForward}
                              disabled={!player}
                              className="flex-1 font-normal"
                          >
                              +5 Secs
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>Seek Forward 5s <Kbd className="ml-1">→</Kbd></p>
                      </TooltipContent>
                  </Tooltip>
              </TooltipProvider>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {
                      if (!player) return;
                      if (isPlaying) {
                        player.pauseVideo();
                      } else {
                        player.playVideo();
                      }
                    }}
                    disabled={!player}
                    className="w-full mt-0 font-normal"
                    variant="outline"
                    size="sm"
                    style={{ boxShadow: 'none' }}
                  >
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isPlaying ? 'Pause Video' : 'Play Video'} <Kbd className="ml-1"><Space className="h-3 w-3" /></Kbd></p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="space-y-1 flex-shrink-0">
            <Label htmlFor="playback-speed-slider" className="text-xs font-normal text-muted-foreground">Misc.</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={toggleMirror}
                    disabled={!videoId}
                    className="w-full font-normal"
                    variant={isMirrored ? "default" : "outline"}
                    size="sm"
                    style={{ boxShadow: 'none' }}
                  >
                    {isMirrored ? 'Unmirror Video' : 'Mirror Video'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Video Mirroring <Kbd className="ml-1">F</Kbd></p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              onClick={handleCopyUrl}
              disabled={!videoId || sections.length === 0}
              className="w-full font-normal"
              variant="outline"
              size="sm"
              style={{ boxShadow: 'none' }}
            >
              {isUrlCopied ? 'Copied!' : 'Copy Shareable URL'}
            </Button>
            <div className="block sm:hidden w-full flex justify-center pt-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-7 w-7"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatTime(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds) || totalSeconds < 0) {
    return '--:--';
  }
  totalSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
