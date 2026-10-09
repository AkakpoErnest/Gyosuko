import bpy, math, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,c,metal=0,rough=.4):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
teal=mat('Gyosoku teal',(.025,.27,.28),.3);navy=mat('Navy',(.015,.05,.075),.35);paper=mat('Warm paper',(.88,.85,.77));wood=mat('Dock oak',(.42,.24,.12),0,.65);orange=mat('Signal orange',(.95,.38,.045));water=mat('Deep harbor water',(.015,.17,.23),.5,.2);silver=mat('Metal rail',(.65,.7,.7),.8);white=mat('Boat white',(.76,.82,.79));black=mat('Phone frame',(.008,.016,.02),.7,.24)
def box(name,loc,scale,m,bevel=.04):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:mod=o.modifiers.new('Soft edges','BEVEL');mod.width=bevel;mod.segments=3;o.modifiers.new('Normals','WEIGHTED_NORMAL')
 return o
def label(name,text,loc,size,m):
 c=bpy.data.curves.new(name,'FONT');c.body=text;c.align_x='CENTER';c.size=size;c.extrude=.002;o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(math.pi/2,0,0);o.data.materials.append(m);return o
# A studio miniature inspired by a working harbor, not a scan of a real location.
box('Sea tile',(0,0,-.12),(5,5,.2),water,.13)
verts=[];faces=[];N=44
for y in range(N):
 for x in range(N):
  a=x/(N-1)*4.9-2.45;b=y/(N-1)*4.9-2.45;verts.append((a,b,.015+math.sin(a*4+b*2)*.025+math.sin(b*7)*.012))
for y in range(N-1):
 for x in range(N-1):i=y*N+x;faces.append((i,i+1,i+N+1,i+N))
mesh=bpy.data.meshes.new('Small ripples');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('Water surface',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(water)
for p in mesh.polygons:p.use_smooth=True
# Dock planks and support posts.
for i in range(12):box('Dock plank',(1.32,-1.7+i*.31,.23),(1.72,.285,.18),wood,.025)
for x in [.58,2.05]:
 for y in [-1.7,1.7]:box('Dock post',(x,y,.05),(.12,.12,.85),navy)
# Boat hull, cabin, rails and antenna.
boat=bpy.data.objects.new('Fishing boat',None);bpy.context.collection.objects.link(boat);boat.location=(-1.05,.05,.10)
def aboard(o):o.parent=boat;return o
outline=[(-.48,-1.05),(.48,-1.05),(.56,.55),(.25,1.03),(0,1.28),(-.25,1.03),(-.56,.55)]
v=[(x*.65,y*.9,0) for x,y in outline]+[(x,y,.44) for x,y in outline];f=[]
for i in range(7):j=(i+1)%7;f.append((i,j,j+7,i+7))
f.extend([tuple(range(6,-1,-1)),tuple(range(7,14))]);me=bpy.data.meshes.new('Boat hull');me.from_pydata(v,[],f);me.update();ob=bpy.data.objects.new('Teal hull',me);bpy.context.collection.objects.link(ob);ob.data.materials.append(teal);aboard(ob);mod=ob.modifiers.new('Hull bevel','BEVEL');mod.width=.04;mod.segments=3;ob.modifiers.new('Hull normals','WEIGHTED_NORMAL')
aboard(box('Deck',(0,-.05,.45),(.86,1.55,.08),paper));aboard(box('Cabin',(0,-.35,.79),(.7,.62,.66),white));aboard(box('Cabin roof',(0,-.35,1.15),(.85,.8,.08),orange));aboard(box('Front window',(0,-.672,.84),(.53,.016,.29),navy,.018));
for side in [-1,1]:aboard(box('Side window',(side*.358,-.35,.84),(.015,.38,.29),navy,.015))
aboard(box('Antenna',(0,-.35,1.43),(.025,.025,.5),silver,.008))
bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.08,location=(0,-.35,1.73));ob=bpy.context.object;ob.data.materials.append(orange);aboard(ob)
for x in [-.42,.42]:
 for y in [.3,.65]:aboard(box('Rail post',(x,y,.68),(.025,.025,.38),silver,.01))
 aboard(box('Top rail',(x,.48,.88),(.025,.58,.025),silver,.01))
# Fish crate and actual Blender fish mesh.
box('Crate',(1.28,-1.06,.47),(1.1,.74,.35),teal)
box('Crate inset',(1.28,-1.06,.66),(.97,.63,.045),navy,.02)
before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT,'public/models/skipjack.glb'))
added=set(bpy.data.objects)-before;fishroot=next(o for o in added if o.parent is None);fishroot.location=(1.28,-1.06,.78);fishroot.scale=(.23,.23,.23);fishroot.rotation_euler=(math.pi/2,0,.12)
# Phone as the link between the landing and the app.
box('Phone',(1.3,.7,1.48),(.95,.17,1.75),black,.09)
box('App screen',(1.3,.602,1.48),(.81,.025,1.5),paper,.045)
label('App name','Gyosoku',(1.3,.58,1.98),.15,navy)
label('Today label','TODAY',(1.3,.575,1.74),.075,teal)
for z,width in [(1.52,.57),(1.34,.42),(1.16,.5)]:
 box('Entry line',(1.3,.565,z),(width,.018,.055),teal,.016)
box('Save button',(1.3,.561,.91),(.62,.02,.15),teal,.026);label('Button text','SAVE',(1.3,.544,.884),.068,paper)
# Looping boat motion and a signal pulse over the app.
bpy.ops.mesh.primitive_torus_add(major_radius=.20,minor_radius=.014,major_segments=32,minor_segments=8,location=(1.3,.60,2.55));signal=bpy.context.object;signal.rotation_euler=(math.pi/2,0,0);signal.data.materials.append(orange)
for frame,phase in [(1,0),(13,math.pi/2),(25,math.pi),(37,3*math.pi/2),(49,2*math.pi)]:
 boat.location.z=.10+math.sin(phase)*.055;boat.rotation_euler=(math.sin(phase)*.025,math.cos(phase)*.04,math.sin(phase)*.015);boat.keyframe_insert('location',frame=frame);boat.keyframe_insert('rotation_euler',frame=frame)
 signal.scale=(1+math.sin(phase)*.22,)*3;signal.keyframe_insert('scale',frame=frame)
scene=bpy.context.scene;scene.frame_start=1;scene.frame_end=48;scene.render.fps=12
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.72,.75,.73,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.7
for loc,power,size,color in [((1,-4,7),1000,5,(1,.83,.65)),((-4,1,5),750,4,(.55,.85,1))]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.data.color=color;l.rotation_euler=(Vector((0,0,.5))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(7,-9,7));cam=bpy.context.object;cam.rotation_euler=(Vector((0,.15,.7))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=7.1;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=12;scene.render.threads_mode='FIXED';scene.render.threads=2;scene.render.resolution_x=560;scene.render.resolution_y=560;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.render.film_transparent=True
os.makedirs('/tmp/gyosoku-harbor-frames',exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'artifacts/gyosoku-harbor-story.blend'))
scene.render.filepath='/tmp/gyosoku-harbor-frames/frame-';bpy.ops.render.render(animation=True)
