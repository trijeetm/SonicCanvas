/*----------------------------------------------------------------------------
  MCD-Y: higher-level objects for audio/graphics/interaction programming
         (sibling of MCD-X API)
 
  Copyright (c) 2013 Ge Wang
    All rights reserved.
    http://ccrma.stanford.edu/~ge/
 
  Music, Computing, Design Group @ CCRMA, Stanford University
    http://ccrma.stanford.edu/groups/mcd/
 
  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation; either version 2 of the License, or
  (at your option) any later version.
 
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
 
  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software
  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307
  U.S.A.
 -----------------------------------------------------------------------------*/

//-----------------------------------------------------------------------------
// name: y-basssynth.cpp
// desc: BASS software synthesizer wrapper
//
// authors: Ge Wang (ge@ccrma.stanford.edu)
//    date: Fall 2011
//    version: 1.0
//-----------------------------------------------------------------------------
#include "y-basssynth.h"
#include <iostream>




// static instantiation
bool YBASSSynth::s_isBassInit = false;
// extern stuff
extern const char BASSFLACplugin, BASSWVplugin;




//-----------------------------------------------------------------------------
// name: YBASSSynth()
// desc: constructor
//-----------------------------------------------------------------------------
YBASSSynth::YBASSSynth()
: m_stream(NULL), m_sf(NULL)
{ }




//-----------------------------------------------------------------------------
// name: ~YBASSSynth()
// desc: destructor
//-----------------------------------------------------------------------------
YBASSSynth::~YBASSSynth()
{
    // lock
    m_mutex.acquire();

    // clean up
    if( m_stream ) BASS_StreamFree( m_stream );
    BASS_Free();
    m_sf = NULL;
    m_stream = NULL;
    
    // unlock
    m_mutex.release();
}




//-----------------------------------------------------------------------------
// name: init()
// desc: init the synth
//-----------------------------------------------------------------------------
bool YBASSSynth::init( int srate, int polyphony )
{    
    // lock
    m_mutex.acquire();
    
    // this is hopefuly optimization for offline rendering
    // taken from sf2pack example
    BASS_SetConfig( BASS_CONFIG_UPDATEPERIOD,0 );
    
    // try to init
	if( !s_isBassInit && !BASS_Init( 0, srate, 0, 0, NULL ) )
    {
        int err = BASS_ErrorGetCode();
        std::cerr << "[synth]: BASS error code: " << err << std::endl;
        m_mutex.release();
        return false;
    }

    // set flag
    s_isBassInit = true;

    // load flac for sf unpacking
    BASS_PluginLoad( &BASSFLACplugin, 0 );
    
    // unlock
    m_mutex.release();
    
    return true;
}




//-----------------------------------------------------------------------------
// name: load()
// desc: load a font
//-----------------------------------------------------------------------------
bool YBASSSynth::load( const char * filename )
{
    // lock
    m_mutex.acquire();
    
    // clean up
    if( m_stream ) BASS_StreamFree( m_stream );

    // create bass stream - 127 channels one for each note
    m_stream = BASS_MIDI_StreamCreate( 127, BASS_STREAM_DECODE, 0 );
    // for( int i = 0; i < 127; i++ )
    //     BASS_MIDI_StreamEvent( m_stream, i, MIDI_EVENT_PITCHRANGE, 8 );
    
    // unlock
    m_mutex.release();
    
    // check it
    if( m_stream == 0 ) 
        return false;

    std::string path = filename;

    // load it
    // std::cerr << "[synth]: loading font file: " << path << std::endl;
    
    // lock
    m_mutex.acquire();
    
    // load new sound font
    bool success = false;
    // go for it
    if( HSOUNDFONT sfNew = BASS_MIDI_FontInit( path.c_str(), 0 ) ) 
    {
        BASS_MIDI_FONT sf;
        sf.font = sfNew;
        sf.preset = -1;                                 // use all presets
        sf.bank = 0;                                    // use default bank(s)
        
        // load font to prevent crackling in case it is packed
        BASS_MIDI_FontLoad( sf.font, sf.preset, sf.bank );
        
        // set default soundfont
        BASS_MIDI_StreamSetFonts( 0, &sf, 1 );
        // set for output stream too
        BASS_MIDI_StreamSetFonts( m_stream, &sf, 1 );
        // free old soundfont
        BASS_MIDI_FontFree( m_sf );
        
        // set our font
        m_sf = sfNew;
        // set flag
        success = true;
    }

    // unlock
    m_mutex.release();

    // return if the font was loaded
    return success;
}




//-----------------------------------------------------------------------------
// name: programChange()
// desc: apply program change
//-----------------------------------------------------------------------------
void YBASSSynth::programChange( int channel, int program )
{
    if( m_stream == 0 ) return;
    if( program < 0 || program > 127 ) return;
    m_mutex.acquire();
    BASS_MIDI_StreamEvent( m_stream, channel, MIDI_EVENT_PROGRAM, MAKEWORD( program, 0 ) );     
    m_mutex.release();
}




//-----------------------------------------------------------------------------
// name: controlChange()
// desc: control change
//-----------------------------------------------------------------------------
void YBASSSynth::controlChange( int channel, int data2, int data3 )
{
    if( m_stream == 0 ) return;
    if( data2 < 0 || data2 > 127 ) return;
//    m_mutex.acquire();
//    m_mutex.release();
}




//-----------------------------------------------------------------------------
// name: noteOn()
// desc: send a note on message
//-----------------------------------------------------------------------------
void YBASSSynth::noteOn( int channel, float pitch, int velocity )
{
    // sanity check
    if( m_stream == 0 ) return;
    
    // integer pitch
    int pitch_i = (int)(pitch + .5f);
    // difference
    float diff = pitch - pitch_i;
    // if needed
    if( diff != 0 )
    {
        // pitch bend
        pitchBend( channel, diff );
    }

    // lock
    m_mutex.acquire();
    // sound note
    if( velocity > 127 ) velocity = 127;    
    // do it
    BASS_MIDI_StreamEvent( m_stream, channel, MIDI_EVENT_NOTE, MAKEWORD( pitch_i, velocity ) ); 
    // unlock
    m_mutex.release();
}




//-----------------------------------------------------------------------------
// name: pitchBend()
// desc: send a pitchBend on message
//-----------------------------------------------------------------------------
void YBASSSynth::pitchBend( int channel, float pitchDiff )
{
    // sanity check
    if( m_stream == 0 ) return;
    // lock
    m_mutex.acquire();
    // pitch bend
    BASS_MIDI_StreamEvent( m_stream, channel, MIDI_EVENT_PITCH, (int)(8192 + pitchDiff * 8191) );
    // unlock
    m_mutex.release();
}




//-----------------------------------------------------------------------------
// name: noteOff()
// desc: send a note off message
//-----------------------------------------------------------------------------
void YBASSSynth::noteOff( int channel, int pitch )
{
    if( m_stream == 0 ) return;
    m_mutex.acquire();
    BASS_MIDI_StreamEvent( m_stream, channel, MIDI_EVENT_NOTE, MAKEWORD( pitch, 0 ) ); 
    m_mutex.release();
}




//-----------------------------------------------------------------------------
// name: allNotesOff()
// desc: send all notes off message
//-----------------------------------------------------------------------------
void YBASSSynth::allNotesOff( int channel )
{
    // send all notes off control message
    // controlChange( channel, 120, 0x7B );
    BASS_MIDI_StreamEvent( m_stream, channel, MIDI_EVENT_NOTE, MAKEWORD( 0, 0 ) ); 
}




//-----------------------------------------------------------------------------
// name: allNotesOffAllChannels()
// desc: send all notes off message to all channels
//-----------------------------------------------------------------------------
void YBASSSynth::allNotesOffAllChannels()
{
    for( int i = 0; i < 128; i++ )
    {
        allNotesOff( i ); 
    }
}




//-----------------------------------------------------------------------------
// name: synthesize2()
// desc: synthesize stereo output (interleaved)
//-----------------------------------------------------------------------------
bool YBASSSynth::synthesize2( float * buffer, unsigned int numFrames )
{
    if( m_stream == 0 ) return false;

    m_mutex.acquire();
    
    // compute
    long sizeInBytes = numFrames * 2 * sizeof(float);
    // get data
    int read = BASS_ChannelGetData( m_stream, buffer, sizeInBytes | BASS_DATA_FLOAT );
    
    m_mutex.release();
    
    // return
    return read > 0;
}
