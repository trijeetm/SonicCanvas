//
//  renderer.cpp
//  GLoiler
//
//  Created by Ge Wang on 1/21/14.
//  Copyright (c) 2014 Ge Wang. All rights reserved.
//

#import "renderer.h"
#import "mo-audio.h"
#import "mo-gfx.h"
#import "mo-touch.h"


#define SRATE 24000
#define FRAMESIZE 512
#define NUM_CHANNELS 2

// global variables
GLfloat g_waveformWidth = 300;
GLfloat g_gfxWidth = 320;
GLfloat g_gfxHeight = 568;

// buffer
SAMPLE g_vertices[FRAMESIZE*2];
UInt32 g_numFrames;



// global
GLuint g_texture[1];
#define NUM_ENTITIES 64

GLfloat rand2f( float a, float b )
{
    GLfloat diff = b - a;
    return a + ((GLfloat)rand() / RAND_MAX)*diff;
}

class Entity
{
public:
    Entity() { bounce = 0.0f; }
    
public:
    Vector3D loc;
    Vector3D ori;
    Vector3D sca;
    Vector3D vel;
    Vector3D col;
    
    GLfloat bounce;
    GLfloat bounce_rate;
};

Entity g_entities[NUM_ENTITIES];

// draw
void drawEntities()
{
    static const GLfloat squareVertices[] = {
        -0.5f,  -0.5f,
        0.5f,  -0.5f,
        -0.5f,   0.5f,
        0.5f,   0.5f,
    };
    
    static const GLfloat normals[] = {
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1
    };
    
    static const GLfloat texCoords[] = {
        0, 1,
        1, 1,
        0, 0,
        1, 0
    };
    
    // clear
    glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT);
    

}




//-----------------------------------------------------------------------------
// name: audio_callback()
// desc: audio callback, yeah
//-----------------------------------------------------------------------------
void audio_callback( Float32 * buffer, UInt32 numFrames, void * userData )
{
    // our x
    SAMPLE x = 0;
    // increment
    SAMPLE inc = g_waveformWidth / numFrames;

    // zero!!!
    memset( g_vertices, 0, sizeof(SAMPLE)*FRAMESIZE*2 );
    
    for( int i = 0; i < numFrames; i++ )
    {
        // set to current x value
        g_vertices[2*i] = x;
        // increment x
        x += inc;
        // set the y coordinate (with scaling)
        g_vertices[2*i+1] = buffer[2*i] * 2 * g_gfxHeight;
        // zero
        buffer[2*i] = buffer[2*i+1] = 0;
    }
    
    // save the num frames
    g_numFrames = numFrames;
    
    // NSLog( @"." );
}




//-----------------------------------------------------------------------------
// name: touch_callback()
// desc: the touch call back
//-----------------------------------------------------------------------------
void touch_callback( NSSet * touches, UIView * view,
                     std::vector<MoTouchTrack> & tracks,
                     void * data)
{
    // points
    CGPoint pt;
    CGPoint prev;
    
    // number of touches in set
    NSUInteger n = [touches count];
    NSLog( @"total number of touches: %d", (int)n );
    
    // iterate over all touch events
    for( UITouch * touch in touches )
    {
        // get the location (in window)
        pt = [touch locationInView:view];
        prev = [touch previousLocationInView:view];
        
        // check the touch phase
        switch( touch.phase )
        {
                // begin
            case UITouchPhaseBegan:
            {
                NSLog( @"touch began... %f %f", pt.x, pt.y );
                break;
            }
            case UITouchPhaseStationary:
            {
                NSLog( @"touch stationary... %f %f", pt.x, pt.y );
                break;
            }
            case UITouchPhaseMoved:
            {
                NSLog( @"touch moved... %f %f", pt.x, pt.y );
                break;
            }
                // ended or cancelled
            case UITouchPhaseEnded:
            {
                NSLog( @"touch ended... %f %f", pt.x, pt.y );
                break;
            }
            case UITouchPhaseCancelled:
            {
                NSLog( @"touch cancelled... %f %f", pt.x, pt.y );
                break;
            }
                // should not get here
            default:
                break;
        }
    }
}

// initialize the engine (audio, grx, interaction)
void GLoilerInit()
{
    NSLog( @"init..." );
    
    // enable texture mapping
    glEnable( GL_TEXTURE_2D );
    // enable blending
    glEnable( GL_BLEND );
    // blend function
    glBlendFunc( GL_ONE, GL_ONE );
    // glBlendFunc( GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA );
    
    // generate texture name
    glGenTextures( 1, &g_texture[0] );
    // bind the texture
    glBindTexture( GL_TEXTURE_2D, g_texture[0] );
    // setting parameters
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR );
    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR );
    // load the texture
    MoGfx::loadTexture( @"texture", @"png" );
    
    // set touch callback
    MoTouch::addCallback( touch_callback, NULL );

    // init
    bool result = MoAudio::init( SRATE, FRAMESIZE, NUM_CHANNELS );
    if( !result )
    {
        // do not do this:
        int * p = 0;
        *p = 0;
    }
    // start
    result = MoAudio::start( audio_callback, NULL );
    if( !result )
    {
        // do not do this:
        int * p = 0;
        *p = 0;
    }
}

// set graphics dimensions
void GLoilerSetDims( float width, float height )
{
    NSLog( @"set dims: %f %f", width, height );
}

// draw next frame of graphics
void GLoilerRender()
{
    // clear the screen
    glClear( GL_COLOR_BUFFER_BIT );
    
    // projection
    glMatrixMode( GL_PROJECTION );
    // load identity
    glLoadIdentity();
    // map the viewport
    // MoGfx::ortho( 320, 480, 1 );
    // perspective projection
    MoGfx::perspective( 70, 2./3., .01, 100 );
    
    // model view
    glMatrixMode(GL_MODELVIEW);
    // identify
    glLoadIdentity();
    // look
    MoGfx::lookAt( 0, 0, 6, 0, 0, 0, 0, 1, 0 );
    
    // draw
    drawEntities();
}

