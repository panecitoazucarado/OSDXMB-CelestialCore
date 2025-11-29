Yume Nikki PS v0.00.1
Created by Elias Daler.

About
-----
Yume Nikki PS is a 3D reimagination of Yume Nikki (2004) for Sony PlayStation 1.
This is a short demo containing two dream worlds. I made it out of love for Yume Nikki and I hope you enjoy it.
Follow me on Twitter (https://twitter.com/EliasDaler) to get updates about this and future projects.
This is a fan project and I am not affiliated with Kikiyama.


Credits
-------
Original game by Kikiyama.
Elias Daler: PS1 programming, 3D modelling and everything else.


Running on real hardware
------------------------
This game can be run on original Sony PlayStation.

    If you have xStation installed, it is the best and most stable way to run the game on the original HW.
    People reported that it works on PSIO on the latest firmware, but I can't test it there as I don't have it.
    If you have a mod-chipped PS1, all you need to do is just burn the CD-R with the provided image (yume_nikki_ps.bin/yume_nikki_ps.cue).
    If your PS1 is not mod-chipped, you need to use one of the methods of running unlicensed PS1 games:
        FreePSXBoot.
        Install UniROM on a cheat cartridge.
        Disk swap trick.

Important: the game might freeze during the loading process when running from CD-R's.

Unfortunately, many PS1 drives are slowly dying and can have problems reading from CD-R's. Burned CD-Rs use a different technology of encoding the data compared to the licensed pressed CDs.
Sadly, I can't do anything about this - if the game freezes during the load for you, try restarting and trying again.


Running on PC (emulation)
-------------------------
You can run the game on your PC via PS1 emulation.
I recommend running the game with DuckStation.
You will need a system BIOS to run the game. You can either use the provided openbios.bin or a retail BIOS.
Note: when setting up DuckStation for the first time, choose the directory where the BIOS is in - it's okay if the files don't show up in the Select Folder dialog.
(You'll get a special surprise when you run with the retail BIOS!).

This game is an NTSC game and I recommend using the follow BIOS:

SCPH-5501 / ps-30a.bin
(MD5: 490F666E1AFB15B7362B406ED1CEA246)
(You'll find it on The Internet Archive easily).

Other platforms
---------------
The game is confirmed to work on PS2. Note that you need to run it via CD and either have mod chipped PS2 or use MechaPwn. POPSTARTER/OPL will NOT work as they use a different (bad) method of emulating PS1 games.
The game works on MiSTer FPGA and Anbernic devices just fine.
The game doesn't work on PS3 and PSP because their PS1 emulation is bad.
The game works on PSVita with RetroArch and PCSX-ReARMed.


Some notes about the controls
------------------------------
It's hard to make a good control scheme for a PS1 game since its original game pads don't have sticks.
I recommend mostly holding "Up" and rotating the camera with L1/R1 to rotate your character. Make sure to hold "Square" when outside to run faster.
I deliberately made the camera control fully manual. I think it's better to have to control the camera yourself than to fight bad automatic camera.


FAQ
---

- Will you remake the whole game?

This would be great... I might return to this project from time to time and add new levels/effects if I have some free time.
If you really wish for the full remake to happen, please leave a comment saying so. If enough positive feedback accumulates, I can use this as a proof that people really want it.
Then, I might pitch the project to PLAYISM (Yume Nikki's publisher) and they might get in touch with Kikiyama. If I get their blessing to remake the game, I'll be happy to work on it.

- How did you make this?

I'm using psyqo as the PS1 SDK (not related to Psy-Q). I'm compiling with GCC and make my models and levels in Blender.
The game runs on a custom engine I'm writing since Jul'24.

- The game is in black in white when running on real console.

If you're running the game on PAL console via composite, the image will be black and white since the game is an NTSC release.
The only fix I can recommend is getting an RGB SCART cable and using a SCART connection instead.

- The game freezes during the loading...

I'm sorry for that... It's either your CD-R drive failing to read data or some rare race condition/undefined behavior which I didn't fix yet.
