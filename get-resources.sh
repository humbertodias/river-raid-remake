#!/bin/bash

$(mkdir -p img && cd img && wget -N -i ../images.txt)
$(mkdir -p snd && cd snd && wget -N -i ../sounds.txt)
