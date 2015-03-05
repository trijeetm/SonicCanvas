//
//  renderer.mm
//  GLoiler (with textures)
//
//  Created by Ge Wang on 1/21/14.
//  Copyright (c) 2014 Ge Wang. All rights reserved.
//

#import <Firebase/Firebase.h>

#import "renderer.h"
#import "mo-audio.h"
#import "mo-gfx.h"
#import "mo-touch.h"
#import "y-basssynth.h"
#import "y-entity.h"
#import <string>
using namespace std;


#define SRATE 44100
#define FRAMESIZE 256
#define NUM_CHANNELS 2

#define DEGREES_TO_RADIANS(x) (3.14159265358979323846 * x / 180.0)
#define RANDOM_FLOAT_BETWEEN(x, y) (((float) rand() / RAND_MAX) * (y - x) + x)

// color scheme
Vector3D cream(1.0, 0.964, 0.898);
Vector3D seaGray(0.243, 0.27, 0.298);
Vector3D lGray(0.878, 0.872, 0.867);
Vector3D warmRed(1.0, 0.498, 0.4);
Vector3D blue(0.494, 0.807, 0.992);

Vector3D ourWhite( 1, 1, 1 );
Vector3D ourRed( 1, .5, .5 );
Vector3D ourBlue( 102.0f/255, 204.0f/255, 1.0f );
Vector3D ourOrange( 1, .75, .25 );
Vector3D ourGreen( .7, 1, .45 );
Vector3D ourGray( .4, .4, .4 );
Vector3D ourYellow( 1, 1, .25 );
Vector3D ourSoftYellow( .7, .7, .1 );
Vector3D ourPurple( .6, .25, .6 );

Vector3D patchColors[5] = { seaGray, ourGray, warmRed, ourRed, ourOrange };

struct pixel {
    int color;
    bool state;
};

// global variables
GLfloat g_gfxWidth = 320;
GLfloat g_gfxHeight = 568;

const int kCanvasHeight = 568;
const int kCanvasWidth = 320;
pixel g_canvas[kCanvasHeight][kCanvasWidth];

// soundfont synth
YBASSSynth g_synth;
// time
double g_now = 0;
// duration
double g_duration = 0;
// len
double g_len = SRATE / 2;


// global
GLuint g_texture[1];
#define NUM_ENTITIES 10

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
void drawCanvas() {
    // clear
    glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT);
    
    for (int y = 0; y < kCanvasHeight; y++) {
        for (int x = 0; x < kCanvasWidth; x++) {
            
        }
    }
}

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
    
    // for each entity
    for( int i = 0; i < NUM_ENTITIES; i++ )
    {
        glPushMatrix();
        
        // translate
        glTranslatef( g_entities[i].loc.x, g_entities[i].loc.y, g_entities[i].loc.z );
        g_entities[i].loc.z += .12f;
        GLfloat val = 1 - fabs(g_entities[i].loc.z)/4.1;
        if( g_entities[i].loc.z > 4 )
        {
//            g_entities[i].loc.x = rand2f( -1.5, 1.5);
//            g_entities[i].loc.y = rand2f( -2.5, 2.5);
            g_entities[i].loc.z = rand2f( -4, -3.5);
        }
        
        // rotate
        glRotatef( g_entities[i].ori.z, 0, 0, 1 );
        g_entities[i].ori.z += 1.5f;
        
        // scale
        glScalef( g_entities[i].sca.x, g_entities[i].sca.y, g_entities[i].sca.z );
        g_entities[i].sca.y = .8 + .2*::sin(g_entities[i].bounce);
//        g_entities[i].bounce += g_entities[i].bounce_rate;
        
        // vertex
        glVertexPointer( 2, GL_FLOAT, 0, squareVertices );
        glEnableClientState(GL_VERTEX_ARRAY);
        
        // color
        float v = val;
        glColor4f( g_entities[i].col.x*v, g_entities[i].col.y*v,
                   g_entities[i].col.z*v, val );
        
        // normal
        glNormalPointer( GL_FLOAT, 0, normals );
        glEnableClientState( GL_NORMAL_ARRAY );
        
        // texture coordinate
        glTexCoordPointer( 2, GL_FLOAT, 0, texCoords );
        glEnableClientState( GL_TEXTURE_COORD_ARRAY );
        
        // triangle strip
        glDrawArrays( GL_TRIANGLE_STRIP, 0, 4 );
        
        glPopMatrix();
    }
}




//-----------------------------------------------------------------------------
// name: audio_callback()
// desc: audio callback, yeah
//-----------------------------------------------------------------------------
void audio_callback( Float32 * buffer, UInt32 numFrames, void * userData )
{
    // get from synth
    g_synth.synthesize2( buffer, numFrames );
    
    // increment now
    g_now += numFrames;
    
    // increment duration
    g_duration += numFrames;
    
    // check
    if( g_duration > g_len )
    {
        // emit chord!
//        g_synth.noteOn( 0, 60, 90 );
//        g_synth.noteOn( 0, 67, 90 );
//        g_synth.noteOn( 0, 76, 127 );
//        // 2nd voice on channel 1
//        g_synth.noteOn( 1, 53, 64 );
        // subtract
        g_duration -= g_len;
    }
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
    
    // init entities
    for( int i = 0; i < NUM_ENTITIES; i++ )
    {
        g_entities[i].loc.x = rand2f( -1, 1 );
        g_entities[i].loc.y = rand2f( -1.5, 1.5 );
        g_entities[i].loc.z = rand2f( -4, 4 );
        
        g_entities[i].ori.z = rand2f( 0, 180 );
        
        g_entities[i].col.x = rand2f( 0, 1 );
        g_entities[i].col.y = rand2f( 0, 1 );
        g_entities[i].col.z = rand2f( 0, 1 );
        
        g_entities[i].sca.x = rand2f( .5, 1 );
        g_entities[i].sca.y = rand2f( 1, 1 );
        g_entities[i].sca.z = rand2f( .5, 1 );
        
        g_entities[i].bounce_rate = rand2f( .25, .5 );
    }
    
    // set touch callback
    MoTouch::addCallback( touch_callback, NULL );
    
    // get path
    string path = [[[NSBundle mainBundle] resourcePath] UTF8String];
    
    // initialization
    g_synth.init( SRATE, 32 );
    // load soundfont
    if( !g_synth.load( (path + "/rocking8m11e.sf2").c_str() ) )
    {
        // error
        NSLog( @"cannot load soundfont... %s", (path + "/rocking8m11e.sf2").c_str() );
    }
    // set instruments for channels 0 and 1
    g_synth.programChange( 0, 0 );
    g_synth.programChange( 1, 20 );
    
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
    // NSLog( @"set dims: %f %f", width, height );
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
    MoGfx::perspective( 10, 2./3., .01, 100 );
    
    // model view
    glMatrixMode(GL_MODELVIEW);
    // identify
    glLoadIdentity();
    // look
    MoGfx::lookAt( 0, 0, 6, 0, 0, 0, 0, 1, 0 );
    
    // draw
    drawCanvas();
//    drawEntities();
    
}

