import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, G, Text as SvgText } from 'react-native-svg';

interface LogoProps {
  width?: number | string;
  height?: number | string;
}

export default function Logo({ width = 120, height = 30 }: LogoProps) {
  // Use explicit brand gradient that works on both dark/light
  // Cyan (#00c6ff) to Blue (#0072ff)
  return (
    <Svg width={width} height={height} viewBox="0 0 500 150">
      <Defs>
        <LinearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#00c6ff" stopOpacity="1" />
          <Stop offset="1" stopColor="#0072ff" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Icon Symbol */}
      <G transform="translate(10, 25) scale(0.1)">
         <Path 
           d="M100,200 Q250,50 400,200 T700,200" 
           fill="none" 
           stroke="url(#brandGrad)" 
           strokeWidth="80" 
           strokeLinecap="round" 
         />
         <Path 
           d="M100,500 Q250,350 400,500 T700,500" 
           fill="none" 
           stroke="url(#brandGrad)" 
           strokeWidth="80" 
           strokeLinecap="round" 
           opacity="0.8"
         />
         <Path 
           d="M100,800 Q250,650 400,800 T700,800" 
           fill="none" 
           stroke="url(#brandGrad)" 
           strokeWidth="80" 
           strokeLinecap="round" 
           opacity="0.6"
         />
      </G>

      {/* Text - Using the same gradient fill */}
      <SvgText
        x="130"
        y="110"
        fill="url(#brandGrad)"
        fontSize="100"
        fontWeight="bold"
        fontFamily="System"
        letterSpacing="4"
      >
        SONIQ
      </SvgText>
    </Svg>
  );
}
