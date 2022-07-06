local __lua_print
__lua_print = function (text)
  print(text)
end
local print
print = function (args)
  __lua_print(args)
end
for it = 1, 3 - 1 do
  print(it)
end
for x = 1, 3 - 1 do
  print(x)
end
for it = 1, 3 - 1 do
  print(it)
end
local array
array = {1, 2, 3}
for __temp_0 = 1, #array do
  local it = (array)[__temp_0]
  local it_index = __temp_0 - 1
  print(it)
end
for __temp_1 = #array, 1, -1 do
  local it = (array)[__temp_1]
  local it_index = __temp_1 - 1
  print(it)
end
for lol = 5 - 1, 1, -1 do
  print(lol)
end
for __temp_2 = 1, #{8, 9, 0} do
  local a = ({8, 9, 0})[__temp_2]
  local a_index = __temp_2 - 1
  print(2 * a)
end
