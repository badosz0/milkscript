local __lua_print
__lua_print = function (text)
  print(text)
end
local print
print = function (args)
  __lua_print(args)
end
do
  local b
  b = 2 + 2
  b = 1
end
local b
b = 1
local a
a = 4 + 4
print(a)
a = function ()
  return 0
end
b = function ()
  return
end
local c
c = function ()
  return 1
end
a = ((1 + 2) + 3)
b = 2 / (5 + 3) / 5 * (14 / 2)
c = 9 + (a + 5) / 2
a = function (b, c)
  if c == nil then c = 3 end
  c = 4
  print(b)
  print(c)
end
a(2, 9)
