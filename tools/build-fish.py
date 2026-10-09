"""Create Gyosoku's original 3D skipjack model with Blender. No external assets."""
import bpy, math, os
from mathutils import Vector
ROOT='/Users/pablo/Gyosuko'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(name,color,metal=.4,rough=.3):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 return m
silver=material('Reflective silver',(0.58,.72,.76),.7,.25)
navy=material('Blue dorsal fins',(.025,.10,.16),.6,.28)
gold=material('Golden finlets',(.42,.31,.095),.6,.3)
black=material('Glossy black eyes',(.004,.009,.015),.25,.08)
root=bpy.data.objects.new('Skipjack',None);bpy.context.collection.objects.link(root)
profile=[(-1.70,.115),(-1.43,.21),(-1.05,.36),(-.6,.50),(-.05,.58),(.5,.56),(.95,.46),(1.3,.35),(1.65,.23),(1.88,.065)]
def radius(x):
 for (a,r),(b,s) in zip(profile,profile[1:]):
  if a<=x<=b:return r+(s-r)*(x-a)/(b-a)
 return .065
verts=[];faces=[];colors=[]
N=65;M=48
for i in range(N):
 x=profile[0][0]+i/(N-1)*(profile[-1][0]-profile[0][0]);r=radius(x)
 for j in range(M):
  th=2*math.pi*j/M;z=math.sin(th);y=math.cos(th)
  verts.append((x,r*y*.67,r*z))
  top=max(0,min(1,(z+.15)/1.15))
  col=tuple((1-top)*a+top*b for a,b in zip((.74,.83,.82),(.017,.08,.15)))
  if -.72<z<-.12 and -1.30<x<1.05 and min(abs(z-k) for k in [-.19,-.35,-.51,-.67])<.035:col=(.055,.12,.17)
  colors.append((*col,1))
for i in range(N-1):
 for j in range(M):a=i*M+j;b=i*M+(j+1)%M;faces.append((a,b,b+M,a+M))
faces.extend([tuple(range(M-1,-1,-1)),tuple((N-1)*M+j for j in range(M))])
mesh=bpy.data.meshes.new('Skipjack body geometry');mesh.from_pydata(verts,[],faces);mesh.update()
body=bpy.data.objects.new('Body',mesh);bpy.context.collection.objects.link(body);body.parent=root
c=mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
for i,col in enumerate(colors):c.data[i].color=col
bodymat=material('Silver blue striped skin',(.55,.70,.75),.65,.31)
v=bodymat.node_tree.nodes.new('ShaderNodeVertexColor');v.layer_name='Color';bodymat.node_tree.links.new(v.outputs['Color'],bodymat.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);body.data.materials.append(bodymat)
for p in mesh.polygons:p.use_smooth=True
# Thin solid fins are sculpted meshes, not billboard images.
def fin(name,pts,mat,parent=root):
 vs=[(x,y-.012,z) for x,y,z in pts]+[(x,y+.012,z) for x,y,z in pts];n=len(pts)
 fs=[tuple(range(n-1,-1,-1)),tuple(n+i for i in range(n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);ob.parent=parent;ob.data.materials.append(mat)
 bevel=ob.modifiers.new('Soft fin edges','BEVEL');bevel.width=.02;bevel.segments=2
 return ob
fin('Dorsal fin',[(-.72,0,.45),(-.17,0,1.02),(.05,0,.60),(.57,0,.53)],navy)
fin('Rear dorsal',[(-1.25,0,.26),(-.95,0,.55),(-.78,0,.39)],navy)
fin('Ventral fin',[(.27,0,-.5),(-.11,0,-.87),(-.43,0,-.45)],silver)
for sign in [-1,1]:
 fin('Pectoral_'+str(sign),[(1.08,sign*.23,.05),(.12,sign*.8,-.2),(.36,sign*.31,-.11)],navy)
 for i in range(5):
  x=-.75-i*.17;r=radius(x)
  fin('Finlet_'+str(sign)+'_'+str(i),[(x,0,sign*r),(x-.17,0,sign*(r+.12)),(x-.22,0,sign*radius(x-.22))],gold)
tailpivot=bpy.data.objects.new('TailPivot',None);bpy.context.collection.objects.link(tailpivot);tailpivot.parent=root;tailpivot.location=(-1.65,0,0)
fin('Forked tail',[(0,0,0),(-.6,0,.75),(-.50,0,.24),(-.30,0,0),(-.50,0,-.24),(-.60,0,-.75)],navy,tailpivot)
for sign in [-1,1]:
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=1,location=(1.48,sign*.255,.12));eye=bpy.context.object;eye.name='Eye_'+str(sign);eye.scale=(.12,.045,.12);eye.parent=root;eye.data.materials.append(black)
 bpy.ops.mesh.primitive_torus_add(major_segments=24,minor_segments=8,location=(1.48,sign*.265,.12),rotation=(math.pi/2,0,0),major_radius=.128,minor_radius=.016);rim=bpy.context.object;rim.name='Eye silver rim';rim.parent=root;rim.data.materials.append(silver)
 # Curved dark gill line on each flank.
 curve=bpy.data.curves.new('Gill','CURVE');curve.dimensions='3D';curve.bevel_depth=.011;curve.bevel_resolution=2;s=curve.splines.new('POLY');s.points.add(12)
 for i,p in enumerate(s.points):
  z=-.3+i*.6/12;x=1.13-.12*math.cos((i/12-.5)*math.pi);r=radius(x);p.co=(x,sign*.67*math.sqrt(max(.01,r*r-z*z)),z,1)
 ob=bpy.data.objects.new('Gill_'+str(sign),curve);bpy.context.collection.objects.link(ob);ob.parent=root;ob.data.materials.append(navy)
# Export the model only. Lighting below is for the editable Blender preview.
bpy.ops.object.select_all(action='DESELECT')
for ob in list(root.children_recursive)+[root]:ob.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.export_scene.gltf(filepath=ROOT+'/public/models/skipjack.glb',export_format='GLB',use_selection=True,export_apply=True)
world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.04,.11,.16,1);world.node_tree.nodes['Background'].inputs[1].default_value=.6
for loc,power,size,col in [((2,-4,6),1100,5,(.75,.9,1)),((-3,1,3),1400,4,(.22,.8,.72)),((2,4,1),900,3,(1,.75,.4))]:
 bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size;light.data.color=col;light.rotation_euler=(Vector((0,0,0))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(3.8,-7,2.3));cam=bpy.context.object;cam.rotation_euler=(Vector((-.15,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=5.5;bpy.context.scene.camera=cam
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=1100;scene.render.resolution_y=760;scene.render.resolution_percentage=100;scene.render.film_transparent=False
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/artifacts/gyosoku-fish.blend')
scene.render.filepath='/tmp/gyosoku-fish-3d-preview.png';bpy.ops.render.render(write_still=True)
print('Gyosoku Blender model and GLB exported')
