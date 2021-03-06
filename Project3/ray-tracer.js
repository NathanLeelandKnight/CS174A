// CS 174a Project 3 Ray Tracer Skeleton

var mult_3_coeffs = function( a, b ) { return [ a[0]*b[0], a[1]*b[1], a[2]*b[2] ]; };       // Convenient way to combine two color-reducing vectors

Declare_Any_Class( "Ball",              // The following data members of a ball are filled in for you in Ray_Tracer::parse_line():
  { 
  	'construct'( position, size, color, k_a, k_d, k_s, n, k_r, k_refract, refract_index )
      { 
      	this.define_data_members( { 
      								position, 
      								size, 
      								color, 
      								k_a, 
      								k_d, 
      								k_s, 
      								n, 
      								k_r, 
      								k_refract, 
      								refract_index,
      								model_transform         : identity(),
      								model_inverse           : identity(),
      								model_inverse_transpose : identity()
      							  } );
 
  // TODO:  Finish filling in data members, using data already present in the others.
        this.model_transform         = mult(this.model_transform, translation(position[0], position[1], position[2]));
        this.model_transform         = mult(this.model_transform, scale(size[0], size[1], size[2]));
        this.model_inverse           = inverse(this.model_transform);
        this.model_inverse_transpose = inverse(transpose(this.model_transform));
      },

    'intersect'( ray, existing_intersection, minimum_dist )
      {
  // TODO:  Given a ray, check if this Ball is in its path.  Recieves as an argument a record of the nearest intersection found so far (a Ball pointer, a t distance
  //        value along the ray, and a normal), updates it if needed, and returns it.  Only counts intersections that are at least a given distance ahead along the ray.
  //        Tip:  Once intersect() is done, call it in trace() as you loop through all the spheres until you've found the ray's nearest available intersection.  Simply
  //        return a dummy color if the intersection tests positiv.  This will show the spheres' outlines, giving early proof that you did intersect() correctly.
  
  		//Transform ray to coordinate system of each ball. This will make the algebra much simplier 
  		//by making the ball a unit ball centered at the origin
  		var ray_prime = {
  							origin : vec4(),
  							dir    : vec4()
  						}

  		ray_prime.origin    = ray.origin;
  		ray_prime.dir       = ray.dir;
  		ray_prime.origin[3] = 1;
  		ray_prime.dir[3]    = 0;

  		ray_prime.dir       = mult_vec(this.model_inverse, ray_prime.dir);
  		ray_prime.origin    = mult_vec(this.model_inverse, ray_prime.origin);
  		ray_prime.dir[3]    = 0;
  		ray_prime.origin[3] = 1;

  		//Calculate the coefficients of the quadractic formula with variable t : (at^2 + bt + c = 0)
  		var a = ray_prime.dir[0]*ray_prime.dir[0] + ray_prime.dir[1]*ray_prime.dir[1] + ray_prime.dir[2]*ray_prime.dir[2];

  		var b = ray_prime.origin[0]*ray_prime.dir[0] + ray_prime.origin[1]*ray_prime.dir[1] + ray_prime.origin[2]*ray_prime.dir[2];

  		var c = ray_prime.origin[0]*ray_prime.origin[0] + ray_prime.origin[1]*ray_prime.origin[1] + ray_prime.origin[2]*ray_prime.origin[2] - 1;
		
		var discrim = ((b*b) - (a*c));
		var t_plus;
		var t_minus;
		var t_intersect = 0;

		//If t has a real root, find the smallest root.
  		if(discrim == 0){
  			t_intersect = -b/a;
  		}
  		else if(discrim > 0){
  			t_minus = -b/a - Math.sqrt(discrim)/a;
  			t_plus  = -b/a + Math.sqrt(discrim)/a;

  			if(t_plus > t_minus){
  				t_intersect = t_minus;
  			}
  			else{
  				t_intersect = t_plus;
  			}
  		}

/*  		
        // Using algebra with no inverse matrix
  		var a = (ray.dir[0]*ray.dir[0])/(this.size[0]*this.size[0]) +
  				(ray.dir[1]*ray.dir[1])/(this.size[1]*this.size[1]) +
  				(ray.dir[2]*ray.dir[2])/(this.size[2]*this.size[2]);

  		var b = (2*ray.dir[0]*(ray.origin[0] - this.position[0]))/(this.size[0]*this.size[0]) +
  				(2*ray.dir[1]*(ray.origin[1] - this.position[1]))/(this.size[1]*this.size[1]) +
  				(2*ray.dir[2]*(ray.origin[2] - this.position[2]))/(this.size[2]*this.size[2]);

  		var c = ((ray.origin[0] - this.position[0])*(ray.origin[0] - this.position[0]))/(this.size[0]*this.size[0]) +
  				((ray.origin[1] - this.position[1])*(ray.origin[1] - this.position[1]))/(this.size[1]*this.size[1]) +
  				((ray.origin[2] - this.position[2])*(ray.origin[2] - this.position[2]))/(this.size[2]*this.size[2]) - 1;

  		var discrim = ((b*b) - (4*a*c));

  		var t_plus;
  		var t_minus;
  		var t_intersect = 0;

  		if(discrim == 0){
  			t_intersect = -b/(2*a);
  		}
  		else if(discrim > 0){
  			t_minus = -b/(2*a) - Math.sqrt(discrim)/(2*a);
  			t_plus  = -b/(2*a) + Math.sqrt(discrim)/(2*a);

  			if(t_plus > t_minus){
  				t_intersect = t_minus;
  			}
  			else{
  				t_intersect = t_plus;
  			}
  		}
*/

  		if(t_intersect >= minimum_dist && t_intersect < existing_intersection.distance){
  			existing_intersection.distance = t_intersect;
  			existing_intersection.ball     = this;

  			var norm_vec = scale_vec(t_intersect, ray_prime.dir);
  			norm_vec[0] = ray_prime.origin[0] + norm_vec[0];
  			norm_vec[1] = ray_prime.origin[1] + norm_vec[1];
  			norm_vec[2] = ray_prime.origin[2] + norm_vec[2];
  			norm_vec[3] = 0;

  			norm_vec = mult_vec(this.model_inverse_transpose, norm_vec);
  			norm_vec[3] = 0;
  			norm_vec = normalize(norm_vec);

  			existing_intersection.normal = norm_vec;
  		}
        
        return existing_intersection;
      }
  } );

Declare_Any_Class( "Ray_Tracer",
  { 'construct'( context )
      { 
      	this.define_data_members( { 
      								width                    : 32, 
      								height                   : 32, 
      								near                     :  1, 
      								left                     : -1, 
      								right                    :  1, 
      								bottom                   : -1, 
      								top                      :  1, 
      								ambient                  : [.1, .1, .1],
                                    balls                    : [], 
                                    lights                   : [], 
                                    curr_background_function : "color", 
                                    background_color         : [0, 0, 0, 1 ],
                                    scanline                 :  0, 
                                    visible                  : true, 
                                    scratchpad               : document.createElement('canvas'), 
                                    gl                       : context.gl,
                                    shader                   : context.shaders_in_use["Phong_Model"] 
                                  } );
        var shapes = { "square": new Square(),                                 // For texturing with and showing the ray traced result
                       "sphere": new Subdivision_Sphere( 4 ) };   			   // For drawing with ray tracing turned off
        
        this.submit_shapes( context, shapes );

        this.texture = new Texture ( context.gl, "", false, false );           // Initial image source: Blank gif file
        this.texture.image.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        context.textures_in_use[ "procedural" ]  =  this.texture;

        this.scratchpad.width   = this.width;  
        this.scratchpad.height  = this.height;
        this.imageData          = new ImageData( this.width, this.height );    // Will hold ray traced pixels waiting to be stored in the texture
        this.scratchpad_context = this.scratchpad.getContext('2d');            // A hidden canvas for assembling the texture

        this.background_functions =                 						   // These convert a ray into a color even when no balls were struck by the ray.
          { 
          	waves: function( ray )
            { 
            	return Color( .5*Math.pow( Math.sin( 2*ray.dir[0] ), 4 ) + Math.abs( .5*Math.cos( 8*ray.dir[0] + Math.sin( 10*ray.dir[1] ) + Math.sin( 10*ray.dir[2] ) ) ),
                              .5*Math.pow( Math.sin( 2*ray.dir[1] ), 4 ) + Math.abs( .5*Math.cos( 8*ray.dir[1] + Math.sin( 10*ray.dir[0] ) + Math.sin( 10*ray.dir[2] ) ) ),
                              .5*Math.pow( Math.sin( 2*ray.dir[2] ), 4 ) + Math.abs( .5*Math.cos( 8*ray.dir[2] + Math.sin( 10*ray.dir[1] ) + Math.sin( 10*ray.dir[0] ) ) ), 1 );
            },

            lasers: function( ray ) 
            { 
            	var u = Math.acos( ray.dir[0] ), v = Math.atan2( ray.dir[1], ray.dir[2] );
                return Color( 1 + .5 * Math.cos( 20 * ~~u  ), 1 + .5 * Math.cos( 20 * ~~v ), 1 + .5 * Math.cos( 8 * ~~u ), 1 );
            },

            mixture:     ( function( ray ) { return mult_3_coeffs( this.background_functions["waves" ]( ray ), 
                                                                   this.background_functions["lasers"]( ray ) ).concat(1); } ).bind( this ),
            ray_direction: function( ray ) { return Color( Math.abs( ray.dir[ 0 ] ), Math.abs( ray.dir[ 1 ] ), Math.abs( ray.dir[ 2 ] ), 1 );  },
            color:       ( function( ray ) { return this.background_color;  } ).bind( this )
          };

        this.make_menu();
        this.load_case( "show_homework_spec" );
      },

    'get_dir'( ix, iy )   
      {    	
      	var x = this.left   + ((this.right - this.left)*ix)/this.width;
    	var y = this.bottom + ((this.top - this.bottom)*iy)/this.height;
    	var z = -this.near;

        return vec4( x, y, z, 0 );
      },

    'color_missed_ray'( ray ) 
      { 
      	return mult_3_coeffs( this.ambient, this.background_functions[ this.curr_background_function ] ( ray ) ).concat(1); 
      },

    'trace'( ray, color_remaining, is_primary, light_to_check = null )
      {
    // TODO:  Given a ray, return the color in that ray's path.  The ray either originates from the camera itself or from a secondary reflection or refraction off of a
    //        ball.  Call Ball.prototype.intersect on each ball to determine the nearest ball struck, if any, and perform vector math (the Phong reflection formula)
    //        using the resulting intersection record to figure out the influence of light on that spot.  Recurse for reflections and refractions until the final color
    //        is no longer significantly affected by more bounces.
    //
    //        Arguments besides the ray include color_remaining, the proportion of brightness this ray can contribute to the final pixel.  Only if that's still
    //        significant, proceed with the current recursion, computing the Phong model's brightness of each color.  When recursing, scale color_remaining down by k_r
    //        or k_refract, multiplied by the "complement" (1-alpha) of the Phong color this recursion.  Use argument is_primary to indicate whether this is the original
    //        ray or a recursion.  Use the argument light_to_check when a recursive call to trace() is for computing a shadow ray.
        
        if( length( color_remaining ) < .3 )    
        	return Color( 0, 0, 0, 1 );  // Each recursion, check if there's any remaining potential for the pixel to be brightened.

        var closest_intersection = { 
        								distance : Number.POSITIVE_INFINITY, 
        							 	ball     : null, 
        							 	normal   : null 
        						   }    // An empty intersection object
        for( let b of this.balls ){
        	closest_intersection = b.intersect(ray, closest_intersection, .0001);
        }

        if(!light_to_check){ 
	        if( !closest_intersection.ball ){
	        	return this.color_missed_ray( ray );
	        }
	        else{
	        	/******************************************************************************************
	        	/Compute rays that point to the light sources and determine if they intersect with other
	        	/ball objects. If the ray intersects with a ball object, do not have that particular light
	        	/source contribute to the pixel color. Else, have that particular light contribute to the
	        	/pixels color. 
	        	/*****************************************************************************************/
	        	var refl_ray =  {
	        						origin : vec4(),
	        						dir    : vec4()
	        					}

	        	var refr_ray =  {
	        						origin : vec4(),
	        						dir    : vec4()
	        					}

	        	var light_ray = {
	        						origin : vec4(),
	        						dir    : vec4()
	        					}

	        	var color_lights = Color(0,0,0,1);      	
	        	var normal_vec   = closest_intersection.normal;

	        	var view_vec     = negate(ray.dir);
	     		view_vec         = normalize(view_vec);
	     		view_vec[3]      = 0;

	        	var halfway_vec  = vec4();
	        	var refract_c    = 0;
	        	var refract_root = 0;
	        	var N_dot_L      = 0;
	        	var N_dot_H      = 0;
	        	var N_dot_C		 = dot(normal_vec.slice(0,3), ray.dir.slice(0,3));

	        	//Calculate reflective ray
				refl_ray.origin[0] = ray.origin[0] + closest_intersection.distance*ray.dir[0];
				refl_ray.origin[1] = ray.origin[1] + closest_intersection.distance*ray.dir[1];
				refl_ray.origin[2] = ray.origin[2] + closest_intersection.distance*ray.dir[2];
				refl_ray.origin[3] = 1;

				refl_ray.dir[0] = -2*N_dot_C*normal_vec[0] + ray.dir[0];
				refl_ray.dir[1] = -2*N_dot_C*normal_vec[1] + ray.dir[1];
				refl_ray.dir[2] = -2*N_dot_C*normal_vec[2] + ray.dir[2];
				refl_ray.dir[3] = 0;

				//Calculate refractive ray
				refr_ray.origin[0] = ray.origin[0] + closest_intersection.distance*ray.dir[0];
				refr_ray.origin[1] = ray.origin[1] + closest_intersection.distance*ray.dir[1];
				refr_ray.origin[2] = ray.origin[2] + closest_intersection.distance*ray.dir[2];
				refr_ray.origin[3] = 1;

				refract_c    = dot(normal_vec.slice(0,3), view_vec.slice(0,3));

				//negated normal
				if(refract_c < 0){
					refract_c = dot(negate(normal_vec).slice(0,3), view_vec.slice(0,3));

					refract_root = 1 - closest_intersection.ball.refract_index*closest_intersection.ball.refract_index*(1 - refract_c*refract_c);

					if(refract_root < 0)
						refract_root = 0;

					refr_ray.dir = add(scale_vec(closest_intersection.ball.refract_index, view_vec).slice(0,3), scale(closest_intersection.ball.refract_index*refract_c - Math.sqrt(refract_root), negate(normal_vec)).slice(0,3));
					refr_ray.dir[3] = 0;
				}
				else{
					refract_root = 1 - closest_intersection.ball.refract_index*closest_intersection.ball.refract_index*(1 - refract_c*refract_c);

					if(refract_root < 0)
						refract_root = 0;

					refr_ray.dir = add(scale_vec(closest_intersection.ball.refract_index, view_vec).slice(0,3), scale(closest_intersection.ball.refract_index*refract_c - Math.sqrt(refract_root), normal_vec).slice(0,3));
					refr_ray.dir[3] = 0;
				}

				//Calculate Light rays
	        	light_ray.origin[0] = ray.origin[0] + closest_intersection.distance*ray.dir[0];
	        	light_ray.origin[1] = ray.origin[1] + closest_intersection.distance*ray.dir[1];
	        	light_ray.origin[2] = ray.origin[2] + closest_intersection.distance*ray.dir[2];
	        	light_ray.origin[3] = 1;

	        	for(let l of this.lights){
		        	light_ray.dir[0]     = l.position[0] - light_ray.origin[0];
		        	light_ray.dir[1]     = l.position[1] - light_ray.origin[1];
		        	light_ray.dir[2]     = l.position[2] - light_ray.origin[2];
		        	light_ray.dir[3]     = 0;

		        	light_ray.dir    = normalize(light_ray.dir);
		        	light_ray.dir[3] = 0;

		        	halfway_vec    = add(light_ray.dir, view_vec);
		        	halfway_vec[3] = 0;
		        	halfway_vec    = normalize(halfway_vec);
		        	halfway_vec[3] = 0;
		        	
		        	N_dot_L      = dot(normal_vec.slice(0,3), light_ray.dir.slice(0,3));
		        	N_dot_H      = dot(normal_vec.slice(0,3), halfway_vec.slice(0,3));
		        	//R_dot_V = dot(refl_ray.dir.slice(0,3), view_vec.slice(0,3));

		        	if(N_dot_L < 0){
		        		N_dot_L      = 0;
		        	}

		        	if(N_dot_H < 0){
		        		N_dot_H = 0;
		        	}

		        	var k_diffuse = scale_vec((closest_intersection.ball.k_d*N_dot_L), closest_intersection.ball.color.slice(0,3));
		        	var k_shine   = scale_vec((closest_intersection.ball.k_s*Math.pow(N_dot_H, closest_intersection.ball.n)), vec3(1,1,1));

		        	color_lights = add(color_lights.slice(0,3), mult_3_coeffs(this.trace(light_ray, color_remaining, false, l).slice(0,3), add(k_diffuse, k_shine).slice(0,3)));
				}
				color_lights    = add(color_lights.slice(0,3), scale_vec(closest_intersection.ball.k_a, closest_intersection.ball.color.slice(0,3)).slice(0,3));
				color_lights[3] = 1;

				for(var i = 0; i < 3; i++){
					if(color_lights[i] > 1)
						color_lights[i] = 1;

					if(color_lights[i] < 0)
						color_lights[i] = 0;
				}



				var complement_color = subtract(Color(1,1,1,1).slice(0,3), color_lights.slice(0,3));

				var refl_color       = this.trace(refl_ray, scale_vec(closest_intersection.ball.k_r, color_remaining), false).slice(0,3);

				refl_color			 = scale_vec(closest_intersection.ball.k_r, refl_color);

				refl_color           = mult_3_coeffs(complement_color, refl_color);

				var refr_color       = this.trace(refr_ray, scale_vec(closest_intersection.ball.k_refract, color_remaining), false).slice(0,3);

				refr_color			 = scale_vec(closest_intersection.ball.k_refract, refr_color);

				refr_color 			 = mult_3_coeffs(complement_color, refr_color);

				var final_color      = add(refl_color.slice(0,3), color_lights.slice(0,3));

				//final_color 	     = add(final_color.slice(0,3), refr_color.slice(0,3));
				
				final_color[3]       = 1;

				return final_color;
	        }
        }
        else{
	        //If null that means there is no ball inbetween the light source and the point of intersection
	        //Thus have the light influence the pixel
	        //Else do not change pixel
	        if(!closest_intersection.ball){
	        	return light_to_check.color;
	        }
	        else{
	        	return Color(0,0,0,1);
	        }
        }
        //return Color( 0, 0, 0, 1 );
      },

    'parse_line'( tokens )            // Load the lines from the textbox into variables
      { 
      	for( let i = 1; i < tokens.length; i++ ) 
      		tokens[i] = Number.parseFloat( tokens[i] );

        switch( tokens[0] )
          { 
          	case "NEAR"   : this.near   = tokens[1];  
          					break;
            case "LEFT"   : this.left   = tokens[1];  
            				break;
            case "RIGHT"  : this.right  = tokens[1];  
            				break;
            case "BOTTOM" : this.bottom = tokens[1];  
            				break;
            case "TOP"    : this.top    = tokens[1];  
            				break;
            case "RES"    : this.width             = tokens[1];   
            				this.height            = tokens[2]; 
                            this.scratchpad.width  = this.width;  
                            this.scratchpad.height = this.height; 
                            break;
            case "SPHERE" : this.balls.push( new Ball( [tokens[1], tokens[2], tokens[3]], 
            										   [tokens[4], tokens[5], tokens[6]], 
            										   [tokens[7], tokens[8], tokens[9]], 
                                                       tokens[10], tokens[11], tokens[12],  
                                                       tokens[13], tokens[14], tokens[15],  
                                                       tokens[16] ) ); 
            				break;
            case "LIGHT"  : this.lights.push( new Light( [ tokens[1],tokens[2],tokens[3], 1 ], Color( tokens[4],tokens[5],tokens[6], 1 ),    10000000 ) ); 
            				break;
            case "BACK"   : this.background_color = Color( tokens[1],tokens[2],tokens[3], 1 ); 
            				this.gl.clearColor.apply( this.gl, this.background_color ); 
            				break;
            case "AMBIENT": this.ambient = [tokens[1], tokens[2], tokens[3]];          
          }
      },

    'parse_file'()        // Move through the text lines
      { 
      	this.balls    			 = [];   
      	this.lights     		 = [];
        this.scanline            = 0; 
        this.scanlines_per_frame = 1;                            					// Begin at bottom scanline, forget the last image's speedup factor
        document.getElementById("progress").style = "display:inline-block;";        // Re-show progress bar
        this.camera_needs_reset = true;                                             // Reset camera
        var input_lines = document.getElementById( "input_scene" ).value.split("\n");

        for( let i of input_lines ) 
        	this.parse_line( i.split(/\s+/) );
      },

    'load_case'( i ) 
      {   
      	document.getElementById( "input_scene" ).value = test_cases[ i ];   
      },

    'make_menu'()
      { 
      	document.getElementById( "raytracer_menu" ).innerHTML = "<span style='white-space: nowrap'> \
          <button id='toggle_raytracing' class='dropbtn' style='background-color: #AF4C50'>Toggle Ray Tracing</button> \
          <button onclick='document.getElementById(\"myDropdown2\").classList.toggle(\"show\"); return false;' class='dropbtn' style='background-color: #8A8A4C'> \
          Select Background Effect</button><div  id='myDropdown2' class='dropdown-content'>  </div>\
          <button onclick='document.getElementById(\"myDropdown\" ).classList.toggle(\"show\"); return false;' class='dropbtn' style='background-color: #4C50AF'> \
          Select Test Case</button        ><div  id='myDropdown' class='dropdown-content'>  </div> \
          <button id='submit_scene' class='dropbtn'>Submit Scene Textbox</button> \
          <div id='progress' style = 'display:none;' ></div></span>";

        for( let i in test_cases )
          { 
          	var a = document.createElement( "a" );
            a.addEventListener("click", function() { this.load_case( i ); 
            										 this.parse_file(); 
            									   }.bind( this ), false);
            a.innerHTML = i;
            document.getElementById( "myDropdown"  ).appendChild( a );
          }

        for( let j in this.background_functions )
          { 
          	var a = document.createElement( "a" );
            a.addEventListener("click", function() { this.curr_background_function = j;      }.bind( this, j ), false);
            a.innerHTML = j;
            document.getElementById( "myDropdown2" ).appendChild( a );
          }
        
        document.getElementById( "input_scene" ).addEventListener( "keydown", function(event) { event.cancelBubble = true; }, false );
        
        window.addEventListener( "click", function(event) {  if( !event.target.matches('.dropbtn') ) {    
          document.getElementById( "myDropdown"  ).classList.remove("show");
          document.getElementById( "myDropdown2" ).classList.remove("show"); } }, false );

        document.getElementById( "toggle_raytracing" ).addEventListener("click", this.toggle_visible.bind( this ), false);
        document.getElementById( "submit_scene"      ).addEventListener("click", this.parse_file.bind(     this ), false);
      },

    'toggle_visible'() 
      { 
      	this.visible = !this.visible; document.getElementById("progress").style = "display:inline-block;" 
      },

    'set_color'( ix, iy, color )                           // Sends a color to one pixel index of our final result
      { 
      	var index = iy * this.width + ix;
        this.imageData.data[ 4 * index     ] = 255.9 * color[0];    
        this.imageData.data[ 4 * index + 1 ] = 255.9 * color[1];    
        this.imageData.data[ 4 * index + 2 ] = 255.9 * color[2];    
        this.imageData.data[ 4 * index + 3 ] = 255;  
      },

    'init_keys'( controls ) 
      { 
      	controls.add( "SHIFT+r", this, this.toggle_visible ); 
      },

    'display'( graphics_state )
      { 
      	graphics_state.lights = this.lights;
        graphics_state.projection_transform = perspective(90, 1, 1, 1000);
        
        if( this.camera_needs_reset ) 
        { 
        	graphics_state.camera_transform = identity(); 
        	this.camera_needs_reset = false; 
        }
        
        if( !this.visible )                          // Raster mode, to draw the same shapes out of triangles when you don't want to trace rays
        { 
        	for( let b of this.balls ) 
        		this.shapes.sphere.draw( graphics_state, b.model_transform, this.shader.material( b.color.concat(1), b.k_a, b.k_d, b.k_s, b.n ) );

          	this.scanline = 0;    
          	document.getElementById("progress").style = "display:none";     
          	return; 
        } 

        if( !this.texture || !this.texture.loaded ) 
        	return;      // Don't display until we've got our first procedural image

        this.scratchpad_context.drawImage( this.texture.image, 0, 0 );
        this.imageData = this.scratchpad_context.getImageData( 0, 0, this.width, this.height );    // Send the newest pixels over to the texture
        var camera_inv = inverse( graphics_state.camera_transform );
        var desired_milliseconds_per_frame = 100;

        if( ! this.scanlines_per_frame ) 
        	this.scanlines_per_frame = 1;

        var milliseconds_per_scanline = Math.max( graphics_state.animation_delta_time / this.scanlines_per_frame, 1 );
        this.scanlines_per_frame = desired_milliseconds_per_frame / milliseconds_per_scanline + 1;

        for( var i = 0; i < this.scanlines_per_frame; i++ )     // Update as many scanlines on the picture at once as we can, based on previous frame's speed
        { 
        	var y = this.scanline++;

          	if( y >= this.height ) 
          	{ 
          		this.scanline = 0; 
          		document.getElementById("progress").style = "display:none";
          	}

          	document.getElementById("progress").innerHTML = "Rendering ( " + 100 * y / this.height + "% )..."; 

          	for ( var x = 0; x < this.width; x++ )
          	{ 
          		var ray = { origin: mult_vec( camera_inv, vec4(0, 0, 0, 1) ), 
          					dir: mult_vec( camera_inv, this.get_dir( x, y ) ) };   // Apply camera

            	this.set_color( x, y, this.trace( ray, [1,1,1], true ) );                                    // ******** Trace a single ray *********
          	}
        }

        this.scratchpad_context.putImageData( this.imageData, 0, 0);          // Draw the image on the hidden canvas
        this.texture.image.src = this.scratchpad.toDataURL("image/png");      // Convert the canvas back into an image and send to a texture
        
        this.shapes.square.draw( new Graphics_State( identity(), identity(), 0 ), 
        						 translation(0,0,-1), 
        						 this.shader.material( Color( 0, 0, 0, 1 ), 1,  0, 0, 1, this.texture ) );
      }
  }, Scene_Component );