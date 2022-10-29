const vertexshader = `
attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec4 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec3 v_normal;
varying vec4 v_color;

void main() {
  gl_Position = u_projection * u_view * u_world * a_position;
  v_normal = mat3(u_world) * a_normal;
  v_color = a_color;
}
`;


const fragmetnshader = `
precision mediump float;

varying vec3 v_normal;
varying vec4 v_color;

uniform vec4 u_diffuse;
uniform vec3 u_lightDirection;

void main () {
  vec3 normal = normalize(v_normal);
  float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
  vec4 diffuse = u_diffuse * v_color;
  gl_FragColor = vec4(diffuse.rgb * fakeLight, diffuse.a);
}
`;
