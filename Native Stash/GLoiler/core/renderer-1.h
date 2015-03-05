//
//  renderer.h
//  GLamor
//
//  Created by Ge Wang on 1/21/14.
//  Copyright (c) 2014 Ge Wang. All rights reserved.
//

#ifndef __GLoiler__renderer__
#define __GLoiler__renderer__


// initialize the engine (audio, grx, interaction)
void GLoilerInit();
// TODO: cleanup
// set graphics dimensions
void GLoilerSetDims( float width, float height );
// draw next frame of graphics
void GLoilerRender();



#endif /* defined(__GLoiler__renderer__) */
